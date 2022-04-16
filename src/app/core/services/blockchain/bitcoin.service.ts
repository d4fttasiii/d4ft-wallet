import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { Psbt, address as Address } from 'bitcoinjs-lib';

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

  private conversionRate = 100000000;

  constructor(protected config: ConfigService, protected httpClient: HttpClient) { }

  async buildRawTx(tx: Transaction): Promise<string> {
    const btx = tx as BitcoinTransaction;
    const btcTx = new Psbt();
    btx.utxos.forEach(u => {
      btcTx.addInput({
        hash: u.txId,
        index: u.outputIndex,
        witnessUtxo: {
          value: u.value,
          script: Buffer.from(u.script, 'hex'),
        },
      });
    });
    btcTx.addOutput({
      address: btx.to,
      value: (btx.amount * this.conversionRate),
    });
    btcTx.addOutput({
      address: btx.to,
      value: btx.utxos.map(u => u.value).reduce((u1, u2) => u1 + u2) - (btx.amount * this.conversionRate) - btx.feeOrGas,
    });

    return btcTx.toHex();
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const ECPair = ECPairFactory(ecc);
    const key = ECPair.fromPrivateKey(Buffer.from(pk));
    const tx = Psbt.fromHex(rawTx);
    await tx.signAllInputsAsync(key);
    tx.finalizeAllInputs();

    return tx.toHex();
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
      Address.fromBech32(address)
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

    return result.final_balance / this.conversionRate;
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
