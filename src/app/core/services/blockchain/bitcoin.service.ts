import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { address as Address, payments, Psbt, networks } from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { Blockchains } from '../../models/blockchains';

import { BitcoinConfig } from '../../models/config';
import { Keypair } from '../../models/keypair';
import { BitcoinTransaction, Transaction, Utxo } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';

class Account {
  address: string;
  final_balance: number;
  txrefs: TxRef[];
  unconfirmed_txrefs: TxRef[];
}

class TxRef {
  tx_hash: string;
  tx_output_n: number;
  value: number;
  script: string;
}

class Tx {
  hash: string;
  outputs: TxOut[];
  hex: string;
}

class TxOut {
  value: number;
  script: string;
  script_type: string;
  addresses: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BitcoinService extends BaseBlockchainClient implements IBlockchainClient {

  derivationkeypath: string = "m/84'/0'/0'/0/0";
  private conversionRate = 100000000;

  constructor(protected config: ConfigService, protected httpClient: HttpClient, protected notification: NotificationService) {
    super(notification);
  }
  async generatePrivateKeyFromMnemonic( mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      throw new Error('Method not implemented.');
    });
  }

  async buildRawTx(tx: Transaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const btx = tx as BitcoinTransaction;
      const cfg = this.getConfig();
      const btcTx = new Psbt({ network: cfg.isMainnet ? networks.bitcoin : networks.testnet });

      for (let i = 0; i < btx.utxos.length; i++) {
        const utxo = btx.utxos[i];
        const prevTx = await this.getTransaction(utxo.txId);
        if (prevTx.outputs[utxo.outputIndex].script_type === 'pay-to-pubkey-hash') {
          btcTx.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            nonWitnessUtxo: Buffer.from(prevTx.hex, 'hex'),
          });
        } else {
          btcTx.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            witnessUtxo: {
              value: utxo.value,
              script: Buffer.from(utxo.script, 'hex'),
            },
          });
        }
      }
      const toTransfer = Math.floor((btx.amount * this.conversionRate));
      const utxoSum = btx.utxos.map(u => u.value).reduce((u1, u2) => u1 + u2);
      const change = utxoSum - toTransfer - btx.feeOrGas;
      btcTx.addOutput({
        address: btx.to,
        value: toTransfer,
      });
      btcTx.addOutput({
        address: btx.from,
        value: change,
      });
      return btcTx.toHex();
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    return this.tryExecute(() => {
      const ECPair = ECPairFactory(ecc);
      const key = ECPair.fromWIF(pk);
      const pbst = Psbt.fromHex(rawTx);
      pbst.signAllInputs(key);
      pbst.finalizeAllInputs();

      return pbst.extractTransaction().toHex();
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const cfg = this.getConfig();
      const payload = `{"jsonrpc": "1.0", "id": "curltest", "method": "sendrawtransaction", "params": ["${rawTx}"]}`;
      const options = { headers: new HttpHeaders().set('Content-Type', 'text/plain') };
      const result = await this.httpClient.post(cfg.url, payload, options).toPromise();

      return JSON.stringify(result);
    });
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      const cfg = this.getConfig();
      Address.toOutputScript(address, cfg.isMainnet ? networks.bitcoin : networks.testnet);
      return await Promise.resolve(true);
    } catch {
      return await Promise.resolve(false);;
    }
  }

  async getUtxos(address: string): Promise<Utxo[]> {
    return await this.tryExecuteAsync(async () => {
      const account = await this.getAccount(address);
      const utxos: Utxo[] = [];
      if (account.txrefs) {
        for (let i = 0; i < account.txrefs.length; i++) {
          const txRef = account.txrefs[i];
          utxos.push({
            outputIndex: txRef.tx_output_n,
            script: txRef.script,
            txId: txRef.tx_hash,
            value: txRef.value,
          });
        }
      }
      if (account.unconfirmed_txrefs) {
        for (let i = 0; i < account.unconfirmed_txrefs.length; i++) {
          const txRef = account.unconfirmed_txrefs[i];
          utxos.push({
            outputIndex: txRef.tx_output_n,
            script: txRef.script,
            txId: txRef.tx_hash,
            value: txRef.value,
          });
        }
      }

      return utxos;
    });
  }

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    return await this.tryExecuteAsync(async () => {
      var result = await this.getAccount(address);
      return result.final_balance / this.conversionRate;
    });
  }

  getMinFeeOrGas(): number {
    return 5430;
  }

  protected async getAccount(address: string): Promise<Account> {
    const cfg = this.getConfig();
    const url = `${cfg.blockcypherUrl}/addrs/${address}?unspentOnly=true&includeScript=true`;
    const result = await this.httpClient.get(url).toPromise();

    return result as Account;
  }

  protected async getTransaction(txId: string): Promise<Tx> {
    const cfg = this.getConfig();
    const url = `${cfg.blockcypherUrl}/txs/${txId}?includeHex=true`;
    const tx = await this.httpClient.get(url).toPromise();

    return tx as Tx;
  }

  protected getConfig(): BitcoinConfig {
    return this.config.get(Blockchains.Bitcoin) as BitcoinConfig;
  }

}
