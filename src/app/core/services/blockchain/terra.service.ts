import { Injectable } from '@angular/core';
import { Coins, Fee, LCDClient, MsgSend, RawKey, SimplePublicKey, Tx } from '@terra-money/terra.js';
import { Blockchains } from '../../models/blockchains';
import { TerraConfig } from '../../models/config';

import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { IBlockchainClient } from './blockchain-client';

class TxInternal {
  from: string;
  to: string;
  gas: number;
  fee: FeeInternal;
  ulunaAmount: number;
  accountNumber: number;
  sequenceNumber: number;
  chainId: string;
  memo?: string;
}

class FeeInternal {
  gasLimit: number;
  amount: string;
}

@Injectable({
  providedIn: 'root'
})
export class TerraService implements IBlockchainClient {

  private convertionRate = 1000000;

  constructor(private configService: ConfigService) { }

  async buildRawTx(tx: Transaction): Promise<string> {
    const ulunaAmount = tx.amount * this.convertionRate;
    const client = this.getClient();
    const accountInfo = await client.auth.accountInfo(tx.from);
    const txInternal = {
      from: tx.from,
      to: tx.to,
      ulunaAmount,
      memo: tx.memo,
      gas: tx.feeOrGas,
      accountNumber: accountInfo.getAccountNumber(),
      sequenceNumber: accountInfo.getSequenceNumber(),
      chainId: client.config.chainID,
    } as TxInternal;
    const fee = await client.tx.estimateFee([{ sequenceNumber: txInternal.sequenceNumber }], {
      msgs: [new MsgSend(
        txInternal.from,
        txInternal.to,
        { uluna: txInternal.ulunaAmount },
      )],
      feeDenoms: ['uluna'],
      gasAdjustment: 1.2,
      gas: txInternal.gas.toString(),
      memo: tx.memo,
      fee: new Fee(txInternal.gas, { uluna: 50 })
    });
    txInternal.fee = {
      gasLimit: fee.gas_limit,
      amount: fee.amount.toString(),
    };

    return JSON.stringify(txInternal);
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const txInternal = JSON.parse(rawTx) as TxInternal;
    const key = new RawKey(Buffer.from(pk, 'hex'));
    const client = this.getClient();
    const wallet = client.wallet(key);
    const signedTx = await wallet.createAndSignTx({
      msgs: [new MsgSend(
        txInternal.from,
        txInternal.to,
        { uluna: txInternal.ulunaAmount },
      )],
      memo: txInternal.memo,
      sequence: txInternal.sequenceNumber,
      accountNumber: txInternal.accountNumber,
      signMode: 1,
      fee: new Fee(txInternal.fee.gasLimit, Coins.fromString(txInternal.fee.amount)),
    });

    return Buffer.from(signedTx.toBytes()).toString('hex');
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const terra = this.getClient();
    const tx = Tx.fromBuffer(Buffer.from(rawTx, 'hex'));
    const result = await terra.tx.broadcast(tx);


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
    return 150000;
  }

  private getClient(): LCDClient {
    const config = this.configService.get(Blockchains.Terra) as TerraConfig;
    const terra = new LCDClient({
      URL: config.url,
      chainID: config.chainId,
    });

    return terra;
  }
}
