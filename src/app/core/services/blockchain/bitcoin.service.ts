import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { BitcoinConfig } from '../../models/config';
import { BitcoinTransaction, Transaction, Utxo } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { IBlockchainClient } from './blockchain-client';

class Account {
  address: string;
  final_balance: number;
  txrefs: TxRef[]
}

class TxRef {
  tx_hash: string;
  tx_output_n: number;
  value: number;
}

class Tx {
  hash: string;
  outputs: TxOut[];
}

class TxOut {
  value: number;
  script: string;
  addresses: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BitcoinService implements IBlockchainClient {

  bitcore = require('bitcore-lib');

  constructor(protected config: ConfigService, protected httpClient: HttpClient) { }

  async buildRawTx(tx: Transaction): Promise<string> {
    const btx = tx as BitcoinTransaction;
    const btcTx = new this.bitcore.Transaction()
      .from(btx.utxos.map(u => {
        return new this.bitcore.Transaction.UnspentOutput({
          script: new this.bitcore.Script(u.script),
          address: u.address,
          outputIndex: u.outputIndex,
          txId: u.txId,
          satoshis: u.value,
        });
      }))
      .to(btx.to, this.bitcore.Unit.fromBTC(btx.amount).toSatoshis())
      .change(btx.from)
      .fee(btx.feeOrGas);

    return btcTx.serialize();
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const cfg = this.getConfig();
    const tx = new this.bitcore.Transaction(rawTx);
    const key = new this.bitcore.PrivateKey(pk, cfg.isMainnet ? this.bitcore.Networks.mainnet : this.bitcore.Networks.testnet);
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
      new this.bitcore.Address(address)
      return await Promise.resolve(true);
    } catch {
      return await Promise.resolve(false);;
    }
  }

  async getUtxos(address: string): Promise<Utxo[]> {
    const account = await this.getAccount(address);
    const utxos: Utxo[] = [];
    if (account.txrefs) {
      for (let i = 0; i < account.txrefs.length; i++) {
        const txRef = account.txrefs[i];
        const tx = await this.getTransaction(txRef.tx_hash);
        utxos.push({
          address: tx.outputs[txRef.tx_output_n].addresses[0],
          outputIndex: txRef.tx_output_n,
          script: tx.outputs[txRef.tx_output_n].script,
          txId: tx.hash,
          value: tx.outputs[txRef.tx_output_n].value,
        });
      }
    }

    return utxos;
  }

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    var result = await this.getAccount(address);

    return this.bitcore.Unit.fromSatoshis(result.final_balance).toBTC();
  }

  getMinFeeOrGas(): number {
    return 5430;
  }

  protected async getAccount(address: string): Promise<Account> {
    const cfg = this.getConfig();
    const url = `${cfg.blockcypherUrl}/addrs/${address}?unspentOnly=true`;
    const result = await this.httpClient.get(url).toPromise();

    return result as Account;
  }

  protected async getTransaction(txId: string): Promise<Tx> {
    const cfg = this.getConfig();
    const url = `${cfg.blockcypherUrl}/txs/${txId}`;
    const tx = await this.httpClient.get(url).toPromise();

    return tx as Tx;
  }

  protected getConfig(): BitcoinConfig {
    return this.config.get(Blockchains.Bitcoin) as BitcoinConfig;
  }

}
