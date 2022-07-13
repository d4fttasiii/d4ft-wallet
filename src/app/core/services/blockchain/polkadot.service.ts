import { Injectable } from '@angular/core';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

import { Blockchains } from '../../models/blockchains';
import { PolkadotConfig } from '../../models/config';
import { Keypair } from '../../models/keypair';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import BigNumber from 'bignumber.js';

@Injectable({
  providedIn: 'root',
})
export class PolkadotService extends BaseBlockchainClient implements IBlockchainClient {
  nativeSymbol: string = "DOT";
  decimals: number = 10;
  derivationkeypath: string; //this chain not using the derivation keypath to generate keypair.
  constructor(private config: ConfigService, protected notification: NotificationService) {
    super(notification);
  }
  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      throw new Error('Method not implemented.');
    });
  }

  buildRawTx(tx: Transaction): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    // const api = await this.getApi();
    // const keyring = new Keyring();
    // keyring.addFromSeed(Buffer.from(pk), {}, 'sr25519');
    // api.tx.balances. .transfer();
    return '';
  }

  submitSignedTx(rawTx: string): Promise<string> {
    throw new Error('Method not implemented.');
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
    // const client = await this.getApi();
    // const balances = await client.balances(address);

    // return (parseFloat(balances[0].free) / 1e12);
    return new BigNumber(0);
  }

  getMinFeeOrGas(): number {
    return 1000;
  }

  // private async getApi(): Promise<ApiPromise> {
  //   const cfg = this.getConfig();
  //   const wsProvider = new WsProvider(cfg.wsUrl);
  //   const api = await ApiPromise.create({ provider: wsProvider });

  //   return api;
  // }

  private getConfig(): PolkadotConfig {
    return this.config.get(Blockchains.Polkadot) as PolkadotConfig;
  }
}
