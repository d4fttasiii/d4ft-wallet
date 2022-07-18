import { Injectable } from '@angular/core';
import { StargateClient, SigningStargateClient, MsgSendEncodeObject, SigningStargateClientOptions, } from '@cosmjs/stargate';
import {
  DirectSecp256k1HdWallet, DirectSecp256k1Wallet, EncodeObject, encodePubkey,
  GeneratedType, makeAuthInfoBytes, makeSignDoc, OfflineSigner, Registry, TxBodyEncodeObject
} from '@cosmjs/proto-signing';

import { Blockchains } from '../../models/blockchains';
import { CosmosConfig } from '../../models/config';
import { CosmosTransaction, Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import { Keypair } from '../../models/keypair';
import { coins, pubkeyType, StdFee, } from '@cosmjs/amino';
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from '@cosmjs/crypto';
import { Int53, Uint53 } from '@cosmjs/math';
import { authzTypes, bankTypes, distributionTypes, feegrantTypes, govTypes, ibcTypes, stakingTypes, vestingTypes, } from '@cosmjs/stargate/build/modules';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { DirectSecp256k1HdWalletOptions } from '@cosmjs/proto-signing';
import { SignDoc, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';
import { Any } from 'cosmjs-types/google/protobuf/any';
import BigNumber from 'bignumber.js';

class UnsignedTxInternal {
  messages: readonly EncodeObject[];
  signerAddress: string;
  fee: StdFee;
  memo: string;
  accountNumber: number;
  sequence: number;
  chainId: string;
}

const defaultRegistryTypes: ReadonlyArray<[string, GeneratedType]> = [
  ['/cosmos.base.v1beta1.Coin', Coin],
  ...authzTypes,
  ...bankTypes,
  ...distributionTypes,
  ...feegrantTypes,
  ...govTypes,
  ...stakingTypes,
  ...ibcTypes,
  ...vestingTypes,
];

function createDefaultRegistry(): Registry {
  return new Registry(defaultRegistryTypes);
}

class StargateSimulatorClient extends StargateClient {
  private registry = createDefaultRegistry();
  constructor(tmClient: Tendermint34Client | undefined, options: SigningStargateClientOptions = {}) {
    super(tmClient, options);
  }

  public static async connect(endpoint: string, options: SigningStargateClientOptions = {}): Promise<StargateSimulatorClient> {
    const tmClient = await Tendermint34Client.connect(endpoint);
    return new StargateSimulatorClient(tmClient, options);
  }

  public async simulate(signerAddress: string, messages: readonly EncodeObject[], memo: string | undefined): Promise<number> {
    const anyMsgs = messages.map((m) => this.registry.encodeAsAny(m));
    const pubkey = {
      type: pubkeyType.secp256k1,
      value: toBase64(
        (await (await DirectSecp256k1HdWallet.generate(24)).getAccounts())[0]
          .pubkey
      ),
    };
    const { sequence } = await this.getSequence(signerAddress);
    const { gasInfo } = await this.forceGetQueryClient().tx.simulate(anyMsgs, memo, pubkey, sequence);
    if (!gasInfo) {
      throw Error('Gas info was not returned');
    }
    return Uint53.fromString(gasInfo.gasUsed.toString()).toNumber();
  }
}

@Injectable({
  providedIn: 'root',
})
export class CosmosService extends BaseBlockchainClient implements IBlockchainClient {
  nativeSymbol: string = "ATOM";
  decimals: number = 6;
  derivationkeypath: string = "m/84'/118'/0'/0/0";

  constructor(private configService: ConfigService, protected notification: NotificationService) {
    super(notification);
  }

  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      const hdPath = stringToPath(keypath ?? this.derivationkeypath);
      const opts: DirectSecp256k1HdWalletOptions = {
        bip39Password: '',
        hdPaths: [hdPath],
        prefix: 'cosmos',
      };
      const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
      const privateKey = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, opts);
      const accounts = await wallet.getAccounts();
      return {
        privateKey: toBase64(privateKey.privkey),
        publicAddress: accounts[0].address,
      };
    });
  }

  async buildRawTx(tx: CosmosTransaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const client = await this.getOnlineClient();
      const { accountNumber, sequence } = await client.getSequence(tx.from);
      const chainId = await client.getChainId();
      const uintAmount = tx.amount.multipliedBy(new BigNumber(1000000));

      if (!uintAmount.isInteger()) {
        throw Error("The transaction amount is exceeded the max decimals: " + this.decimals)
      }
      const sendMsg: MsgSendEncodeObject = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: tx.from,
          amount: coins(uintAmount.toString(), 'uatom'),
          toAddress: tx.to,
        },
      };
      await this.simulateTransaction(client, tx, sendMsg);
      const txData: UnsignedTxInternal = {
        signerAddress: tx.from,
        messages: [sendMsg],
        fee: {
          amount: [{ denom: 'uatom', amount: tx.fee.toString() }], // this would be the actual fee which is auto-deducted from the sender's account
          gas: tx.gas.toString(), //this is the max gas limit
        },
        memo: tx.memo ?? '',
        accountNumber: accountNumber,
        sequence: sequence,
        chainId: chainId,
      };
      return JSON.stringify(txData);
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const txData = JSON.parse(rawTx) as UnsignedTxInternal;
      const wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(pk, 'base64'));
      const account = (await wallet.getAccounts())[0];
      const signDoc = this.createSignDocument(txData, account.pubkey);
      const { signature, signed } = await wallet.signDirect(txData.signerAddress, signDoc);

      const signedTx: TxRaw = TxRaw.fromPartial({
        bodyBytes: signed.bodyBytes,
        authInfoBytes: signed.authInfoBytes,
        signatures: [fromBase64(signature.signature)],
      });
      const signedTxJson = TxRaw.toJSON(signedTx);
      return JSON.stringify(signedTxJson);
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const txRaw = TxRaw.fromJSON(JSON.parse(rawTx));
      const txBytes = TxRaw.encode(txRaw).finish();
      const client = await this.getOnlineClient();
      const result = await client.broadcastTx(txBytes);
      return result.transactionHash;
    });
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      const client = await this.getOnlineClient();
      const account = await client.getAccount(address);

      if (account) {
        return true;
      } else {
        const getBalance = await this.getBalance(address);
        return (getBalance.gte(0)) ? true : false;
      }
    } catch {
      return false;
    }
  }

  async getBalance(address: string, contractAddress?: string): Promise<BigNumber> {
    return await this.tryExecuteAsync(async () => {
      const client = await this.getOnlineClient();
      const atom = await client.getBalance(address, 'uatom');
      return new BigNumber(atom.amount).dividedBy(1000000);
    });
  }

  getFeeOrGasInfo(tx?: any): Promise<any> {
    return Promise.resolve(200000);
  }

  getMaxGas(): number { return 200000; }
  getDefaultFee(): number { return 0; }

  private async simulateTransaction(client: StargateSimulatorClient, tx: CosmosTransaction, sendMsg: MsgSendEncodeObject) {
    try {
      const gasUsed = await client.simulate(tx.from, [sendMsg], tx.memo);
      console.log("Estimated gas used:" + gasUsed + "\nEstimated fee (gas used * 1.3 * gasprice(0.0025)):" + gasUsed * 1.3 * 0.0025);
    }
    catch {
      console.log("gas estimation failed.");
    }
  }

  private createSignDocument(txData: UnsignedTxInternal, pubKey: Uint8Array): SignDoc {
    // txBodyBytes
    const registry = createDefaultRegistry();
    const txBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: txData.messages,
        memo: txData.memo,
      }
    };
    const txBodyBytes = registry.encode(txBodyEncodeObject);

    // authInfoBytes
    const publicKey: Any = encodePubkey({
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(pubKey),
    });
    const authInfoBytes = makeAuthInfoBytes([{ pubkey: publicKey, sequence: txData.sequence }],
      txData.fee.amount, //fee
      Int53.fromString(txData.fee.gas).toNumber() //gas limit
    );
    return makeSignDoc(txBodyBytes, authInfoBytes, txData.chainId, txData.accountNumber);
  }

  /** returns an online StargateClient, which is able to query blockchain but not able to sign*/
  private async getOnlineClient(): Promise<StargateSimulatorClient> {
    const config = this.configService.get(Blockchains.Cosmos) as CosmosConfig;
    const client = await StargateSimulatorClient.connect(config.endpoint);
    return client;
  }
}
