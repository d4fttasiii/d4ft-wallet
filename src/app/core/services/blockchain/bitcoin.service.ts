import { Injectable } from '@angular/core';

import { Transaction } from '../../models/transaction';
import { IBlockchainClient } from './blockchain-client';

import { address as Address } from 'bitcoinjs-lib';
import { Blockchains } from '../../models/blockchains';
import { BitcoinConfig } from '../../models/config';
import { ConfigService } from '../config/config.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BitcoinService implements IBlockchainClient {

  private readonly convertionRate = 100000000;

  constructor(protected config: ConfigService, protected httpClient: HttpClient) { }

  buildRawTx(tx: Transaction): Promise<string> {
    throw new Error('Method not implemented.');
  }

  signRawTx(rawTx: string, pk: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  submitSignedTx(rawTx: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      Address.fromBech32(address); 
      return await Promise.resolve(true);
    } catch {
      return await Promise.resolve(false);;
    }
  }

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    const cfg = this.getConfig();
    const url = `${cfg.blockcypherUrl}/addrs/${address}?unspentOnly=true`;
    const result = await this.httpClient.get(url).toPromise();
    const satoshi = parseInt(result['final_balance'], 10);

    return satoshi / this.convertionRate;
  }

  getMinFeeOrGas(): number {
    return 0;
  }

  // protected getClient(): Web3 {
  //   const cfg = this.getConfig();
  //   return new Web3(new Web3.providers.HttpProvider(cfg.url));
  // }

  protected getConfig(): BitcoinConfig {
    return this.config.get(Blockchains.Bitcoin) as BitcoinConfig;
  }

}
