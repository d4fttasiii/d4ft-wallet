import { Injectable } from '@angular/core';
import { LCDClient, MsgSend, RawKey, SimplePublicKey, Tx } from '@terra-money/terra.js';

import { Transaction } from '../../models/transaction';
import { IBlockchainClient } from './blockchain-client';

class TxInternal {
  from: string;
  to: string;
  fee: number;
  ulunaAmount: number;
  accountNumber: number;
  sequenceNumber: number;
  chainId: string;
  memo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TerraService implements IBlockchainClient {

  private convertionRate = 1000000;

  constructor() { }

  async buildRawTx(tx: Transaction): Promise<string> {
    const ulunaAmount = tx.amount * this.convertionRate;
    const client = this.getClient();
    const accountInfo = await client.auth.accountInfo(tx.from);
    return JSON.stringify({
      from: tx.from,
      to: tx.to,
      ulunaAmount,
      memo: tx.memo,
      fee: tx.feeOrGas,
      accountNumber: accountInfo.getAccountNumber(),
      sequenceNumber: accountInfo.getSequenceNumber(),
      chainId: client.config.chainID,
    } as TxInternal);
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const txInternal = JSON.parse(rawTx) as TxInternal;
    const key = new RawKey(Buffer.from(pk, 'hex'));
    const client = this.getClient();
    const wallet = client.wallet(key);
client.
    const tx = await wallet.createTx({
      msgs: [new MsgSend(
        txInternal.from,
        txInternal.to,
        { uluna: txInternal.ulunaAmount },
      )],
      sequence: txInternal.sequenceNumber,
      memo: txInternal.memo,      
    });
    const signedTx = await wallet.createAndSignTx({
      msgs: [new MsgSend(
        txInternal.from,
        txInternal.to,
        { uluna: txInternal.ulunaAmount },
      )],
      memo: txInternal.memo,
    });

    return Buffer.from(signedTx.toBytes()).toString('hex');
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const terra = this.getClient();
    const tx = Tx.fromBuffer(Buffer.from(rawTx, 'hex'));
    const result = await terra.tx.broadcastAsync(tx);

    return result.txhash
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      SimplePublicKey.fromData({ "@type": '/cosmos.crypto.secp256k1.PubKey', key: address });
      return await Promise.resolve(true);
    }
    catch {
      return await Promise.resolve(false);
    }
  }

  async getBalance(address: string): Promise<number> {
    const client = this.getClient();
    try {
      const balances = await client.bank.balance(address);
      const uluna = balances[0]['_coins'].uluna.amount.toNumber();
      return uluna / this.convertionRate;
    }
    catch {
      return 0;
    }
  }

  getMinFeeOrGas(): number {
    return 1;
  }

  private getClient(): LCDClient {
    const terra = new LCDClient({
      URL: 'https://bombay-fcd.terra.dev',
      chainID: 'bombay-12',
    });

    return terra;
  }
}
