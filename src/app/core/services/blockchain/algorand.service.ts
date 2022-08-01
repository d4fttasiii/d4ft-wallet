import { Injectable } from '@angular/core';
import algosdk, { decodeSignedTransaction } from 'algosdk';

import { Blockchains } from '../../models/blockchains';
import { AlgorandConfig } from '../../models/config';
import { Keypair } from '../../models/keypair';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import BigNumber from 'bignumber.js';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';

const bip32 = BIP32Factory(ecc);

@Injectable({
  providedIn: 'root'
})
export class AlgorandService extends BaseBlockchainClient implements IBlockchainClient {
  nativeSymbol: string = "ALGO";
  decimals: number = 6;
  derivationkeypath: string = "m/44'/283'/0'/0/0";

  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(notification);
  }

  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const root = bip32.fromSeed(seed);
      const keyPair = root.derivePath(keypath ? keypath : this.derivationkeypath);
      const algo_mnemonic = algosdk.mnemonicFromSeed(keyPair.privateKey);
      const sk = algosdk.mnemonicToSecretKey(mnemonic);
      return {
        privateKey: algo_mnemonic,
        publicAddress: sk.addr,
        actual_privateKey: Buffer.from(sk.sk).toString('hex'),
      }
    });
  }

  async buildRawTx(tx: Transaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const client = this.getAlgodClient();
      let params = await client.getTransactionParams().do();
      params.fee = tx.feeOrGas;
      params.flatFee = true;

      const algoTx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: algosdk.algosToMicroalgos(tx.amount.toNumber()),
        from: tx.from,
        to: tx.to,
        note: tx.memo ? new TextEncoder().encode(tx.memo) : undefined,
        suggestedParams: params,
      });
      const encodedTx = Buffer.from(algosdk.encodeUnsignedTransaction(algoTx)).toString('hex');

      return encodedTx;
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const tx = algosdk.decodeUnsignedTransaction(Buffer.from(rawTx, 'hex'));

      const secretkey = algosdk.mnemonicToSecretKey(pk);
      const signedTxBytes = tx.signTxn(secretkey.sk);

      return Buffer.from(signedTxBytes).toString('hex');
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const signedTxHex = Buffer.from(rawTx, 'hex');
      const signedTx = decodeSignedTransaction(signedTxHex);
      const txId = signedTx.txn.txID();
      const client = this.getAlgodClient();
      await client.sendRawTransaction(signedTxHex).do();
      await algosdk.waitForConfirmation(client, txId, 4);

      return txId;
    });
  }

  async isAddressValid(address: string): Promise<boolean> {
    return await Promise.resolve(algosdk.isValidAddress(address));
  }

  async getBalance(address: string, contractAddress?: string): Promise<BigNumber> {
    try {
      const client = this.getAlgodClient();
      const accountInfo = await client.accountInformation(address).do();
      return new BigNumber(algosdk.microalgosToAlgos(accountInfo.amount));
    }
    catch {
      return new BigNumber(0);
    }
  }

  getFeeOrGasInfo(tx?: any): Promise<any> {
    return Promise.resolve(1000);
  }

  private getAlgodClient() {
    const cfg = this.getConfig();
    const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const client = new algosdk.Algodv2(algodToken, cfg.algodServer, cfg.algodPort);

    return client;
  }

  private getIndxrClient() {
    const cfg = this.getConfig();
    const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const client = new algosdk.Indexer(algodToken, cfg.indxrServer, cfg.indxrPort)

    return client;
  }

  private getConfig(): AlgorandConfig {
    return this.config.get(Blockchains.Algorand) as AlgorandConfig;
  }
}
