import { Injectable } from '@angular/core';
import { IBlockchainClient } from './blockchain-client';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { hexToU8a } from '@polkadot/util'
import {
  construct,
  methods,
  importPrivateKey,
  getRegistry,
} from '@substrate/txwrapper-polkadot';

@Injectable({
  providedIn: 'root',
})
export class PolkadotService  {
  constructor() {}

  // async buildRawTx(from: string, to: string, amount: number): Promise<string> {}

  // signRawTx(rawTx: string, pk: string): string {
  //   const kr = new Keyring({ type: 'sr25519' });
  //   kr.addFromSeed(hexToU8a(pk));    
  // }

  // async submitSignedTx(rawTx: string): Promise<string> {
  //   const api = await this.getApi();
  //   await api.connect();
  // }

  private async getApi(): Promise<ApiPromise> {
    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });
    return api;
  }
}
