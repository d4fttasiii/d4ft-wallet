import { Injectable } from '@angular/core';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

import { Blockchains } from '../../models/blockchains';
import { PolkadotConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';

@Injectable({
  providedIn: 'root',
})
export class PolkadotService extends BaseBlockchainClient implements IBlockchainClient {

  constructor(private config: ConfigService, protected notification: NotificationService) {
    super(notification);
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

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    // const client = await this.getApi();
    // const balances = await client.balances(address);

    // return (parseFloat(balances[0].free) / 1e12);
    return 0;
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
