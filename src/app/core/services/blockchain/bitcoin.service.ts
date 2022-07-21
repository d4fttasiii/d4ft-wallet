import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { address as Address, payments, Psbt, networks } from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
const bip32 = BIP32Factory(ecc);
import { Blockchains } from '../../models/blockchains';

import { BitcoinConfig } from '../../models/config';
import { Keypair } from '../../models/keypair';
import { BitcoinTransaction, Transaction, Utxo } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';

import BigNumber from 'bignumber.js';
import { stringify } from 'querystring';
import { mnemonicToSeed } from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { firstValueFrom, lastValueFrom } from 'rxjs';


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
  nativeSymbol: string = "BTC";
  decimals: number = 8;

  derivationkeypath: string = "m/84'/0'/0'/0/0";
  private conversionRate = new BigNumber(10).pow(this.decimals); //100_000_000

  constructor(protected config: ConfigService, protected httpClient: HttpClient, protected notification: NotificationService) {
    super(notification);
  }
  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      if (bip39.validateMnemonic(mnemonic)) {
        ECPairFactory
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const root = bip32.fromSeed(seed);
        const keyPair = root.derivePath(keypath ? keypath : this.derivationkeypath);
        const strng = keyPair.toBase58()
        const restored = bip32.fromBase58(strng);
        const privKey = keyPair.toWIF()
        const network = this.getNetwork();
        const address = bitcoin.payments.p2wpkh({ pubkey: restored.publicKey, network: network }).address;
        const address2 = bitcoin.payments.p2pkh({ pubkey: restored.publicKey, network: network }).address;
        return {
          privateKey: privKey,
          publicAddress: address,
          alternativeAddress: address2
        };
      } else { throw new Error('Invalid mnemonic keypharse'); }
    });
  }
  protected getNetwork(isMainnet?: boolean) {
    if (typeof (isMainnet) === "undefined") {
      isMainnet = this.getConfig().isMainnet
    }
    return isMainnet ? networks.bitcoin : networks.testnet
  }

  async buildRawTx(tx: Transaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const btx = tx as BitcoinTransaction;
      const psbt = new Psbt({ network: this.getNetwork() });
      for (let i = 0; i < btx.utxos.length; i++) {
        const utxo = btx.utxos[i];
        const prevTx = await this.getTransaction(utxo.txId);
        if (prevTx.outputs[utxo.outputIndex].script_type === 'pay-to-pubkey-hash') {
          psbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            nonWitnessUtxo: Buffer.from(prevTx.hex, 'hex'),
          });
        } else {
          psbt.addInput({
            hash: utxo.txId,
            index: utxo.outputIndex,
            witnessUtxo: {
              value: utxo.value,
              script: Buffer.from(utxo.script, 'hex'),
            },
          });
        }
      }
      const bn = btx.amount.multipliedBy(this.conversionRate);
      if (!bn.isInteger()) {
        throw Error(`The transaction amount is exceeded the max decimals: ${this.decimals}`)
      }
      const toTransfer = bn.toNumber();
      const utxoSum = btx.utxos.map(u => u.value).reduce((u1, u2) => u1 + u2);
      const change = utxoSum - toTransfer - btx.feeOrGas;
      psbt.addOutput({
        address: btx.to,
        value: toTransfer,
      });
      psbt.addOutput({
        address: btx.from,
        value: change,
      });

      return psbt.toHex();
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
      const payload = `{"tx":"${rawTx}"}`
      const options = { headers: new HttpHeaders().set('Content-Type', 'text/plain') };
      const url = `${cfg.blockcypherUrl}/txs/push`;
      const result = this.httpClient.post(url, payload, options);
      const thefirst = await firstValueFrom(result) as { tx: { hash: string } };
      return thefirst.tx.hash;
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

  async getBalance(address: string, contractAddress?: string): Promise<BigNumber> {

    return await this.tryExecuteAsync(async () => {
      var result = await this.getAccount(address);
      return new BigNumber(result.final_balance).dividedBy(this.conversionRate);
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
