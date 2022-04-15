import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as bitcore from 'bitcore-lib';

import { Blockchains } from '../../models/blockchains';
import { BitcoinConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { IBlockchainClient } from './blockchain-client';

@Injectable({
  providedIn: 'root'
})
export class BitcoinService implements IBlockchainClient {

  private readonly convertionRate = 100000000;

  constructor(protected config: ConfigService, protected httpClient: HttpClient) { }

  buildRawTx(tx: Transaction): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const tx = new bitcore.Transaction(rawTx);
    const key = new bitcore.PrivateKey(pk);
    tx.sign(key);
    
    return await Promise.resolve(tx.serialize());
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const cfg = this.getConfig();
    const payload = `{"jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": ["${rawTx}"]}`;
    const options = { headers: new HttpHeaders().set('Content-Type', 'text/plain') };
    const result = await this.httpClient.post(cfg.url, payload, options).toPromise();

    return result.toString();
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      new bitcore.Address(address)
      return await Promise.resolve(true);
    } catch {
      return await Promise.resolve(false);;
    }
  }

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    var result = await this.getAddress(address);
    const satoshi = parseInt(result['final_balance'], 10);

    return satoshi / this.convertionRate;
  }

  getMinFeeOrGas(): number {
    return 0;
  }

  protected async getAddress(address: string) {
    const cfg = this.getConfig();
    const url = `${cfg.blockcypherUrl}/addrs/${address}?unspentOnly=true`;
    const result = await this.httpClient.get(url).toPromise();
    return result;
  }

  protected getConfig(): BitcoinConfig {
    return this.config.get(Blockchains.Bitcoin) as BitcoinConfig;
  }

}
