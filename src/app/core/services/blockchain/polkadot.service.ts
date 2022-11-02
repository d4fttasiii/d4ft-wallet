import { Injectable } from '@angular/core';
import Keyring, { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { assert, hexToU8a, isHex, u8aToHex } from '@polkadot/util';

import { Blockchains } from '../../models/blockchains';
import { PolkadotConfig } from '../../models/config';
import { Keypair } from '../../models/keypair';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import BigNumber from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { blake2AsHex, cryptoWaitReady } from '@polkadot/util-crypto';
type Curves = 'ed25519' | 'sr25519' | 'ecdsa';

export class PolkadotSignDto {
  from: string;
  signerPayload: string;
  unsignedPayload: string;
  signature: string;
  tx: string;
}

@Injectable({
  providedIn: 'root',
})
export class PolkadotService extends BaseBlockchainClient implements IBlockchainClient {
  nativeSymbol: string = "DOT";
  decimals: number = 10;
  derivationkeypath: string = 'sr25519'; //this chain not using the derivation keypath to generate keypair.
  ss58Format = 0;
  type: Curves = 'sr25519';
  defaultFee = 100000000;

  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(notification);
  }

  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      await cryptoWaitReady();
      const keyring = new Keyring({ type: keypath as Curves, ss58Format: this.ss58Format });
      const keypair = keyring.addFromUri(mnemonic);
      return {
        privateKey: mnemonic,
        publicAddress: keypair.address
      }
    });
  }

  //https://github.com/polkadot-js/tools/blob/master/packages/signer-cli/src/cmdSendOffline.ts

  async buildRawTx(tx: Transaction): Promise<string> {
    const api = await this.getApi();
    let accountInfo = await api.query.system.account(tx.from);
    const amount = tx.amount.multipliedBy(new BigNumber(10).pow(this.decimals));
    const rawTx = api.tx.balances.transfer(tx.to, amount.toString());

    let payload = {
      blockHash: api.genesisHash.toString(),
      genesisHash: api.genesisHash.toString(),
      nonce: accountInfo.nonce,
      runtimeVersion: api.runtimeVersion,
      address: tx.from,
      method: rawTx,
      version: api.extrinsicVersion,
      signedExtensions: api.registry.signedExtensions,
      tip: 0,
      era: 0,
    };

    const signerPayload = api.createType("SignerPayload", payload);
    let originUnsigin = signerPayload.toRaw().data;
    let unsigned = (originUnsigin.length > (256 + 1) * 2) ? blake2AsHex(originUnsigin) : originUnsigin;
    return JSON.stringify({
      from: tx.from,
      signerPayload: signerPayload.toHex(),
      unsignedPayload: unsigned,
      tx: rawTx.toHex()
    })
  }

  protected validatePayload(payload: string): void {
    assert(payload && payload.length > 0, 'Cannot sign empty payload. Please check your input and try again.');
    assert(isHex(payload), 'Payload must be supplied as a hex string. Please check your input and try again.');
  }

  //https://github.com/polariseye/polka_statemint_test/blob/main/index.ts


  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const input = JSON.parse(rawTx) as PolkadotSignDto;
    this.validatePayload(input.unsignedPayload);
    await cryptoWaitReady();
    const keyringObj = new Keyring({ type: 'sr25519', ss58Format: this.ss58Format });
    const kp = keyringObj.createFromUri(pk);
    let signature = kp.sign(hexToU8a(input.unsignedPayload), { withType: true });
    input.signature = u8aToHex(signature);;
    return JSON.stringify(input);
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const input = JSON.parse(rawTx) as PolkadotSignDto;
    const api = await this.getApi();
    const tx = api.createType('Extrinsic', input.tx);
    const signerPayload = api.createType("SignerPayload", input.signerPayload);
    const payload = signerPayload.toPayload();
    const signature = hexToU8a(input.signature);
    tx.addSignature(input.from, signature, payload);
    const hash = await api.rpc.author.submitExtrinsic(tx);
    return hash.toHex();
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      encodeAddress(
        isHex(address)
          ? hexToU8a(address)
          : decodeAddress(address)
      );
      return await Promise.resolve(true);
    } catch (error) {
      return await Promise.resolve(false);
    }
  }

  async getBalance(address: string, contractAddress?: string): Promise<BigNumber> {
    const api = await this.getApi();
    const { nonce, data: balance } = await api.query.system.account(address);
    return new BigNumber(balance.free.toString()).dividedBy(new BigNumber(10).pow(this.decimals))
  }

  async getFeeOrGasInfo(tx?: any): Promise<any> {
    if (tx) {
      const api = await this.getApi();
      const txo = api.tx.balances.transfer(tx.to, this.toSmallestUnit(tx.amount));
      let feeInfo = await txo.paymentInfo(tx.from);
      return feeInfo.partialFee.toString();
    }
    return this.defaultFee;
  }

  protected toSmallestUnit(amount: BigNumber | string): string {
    return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(this.decimals)).toString(10);
  }

  protected async getApi(): Promise<ApiPromise> {
    const cfg = this.getConfig();
    const wsProvider = new WsProvider(cfg.wsUrl);
    const api = await ApiPromise.create({ provider: wsProvider });

    return api;
  }

  protected getConfig(): PolkadotConfig {
    return this.config.get(Blockchains.Polkadot) as PolkadotConfig;
  }
}
