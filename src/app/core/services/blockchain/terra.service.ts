import { Injectable } from '@angular/core';
import { LCDClient, SimplePublicKey, MsgSend, RawKey, Tx, TxBody } from '@terra-money/terra.js';
import { from } from 'rxjs';
import { IBlockchainClient } from './blockchain-client';

class TxInternal {
  from: string;
  to: string;
  ulunaAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TerraService implements IBlockchainClient {

  constructor() { }

  async buildRawTx(from: string, to: string, amount: number): Promise<string> {
    const ulunaAmount = amount * 1000000;
    const msg = new MsgSend(
      from,
      to,
      { uluna: ulunaAmount },
    );
    const tx = TxBody.fromData({
      messages: [msg.toData()],
      memo: '',
      timeout_height: '100',
    });

    return JSON.stringify({
      from, to, ulunaAmount
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const txInternal = JSON.parse(rawTx) as TxInternal;
    const key = new RawKey(Buffer.from(pk, 'utf8'));
    const client = this.getClient();
    const accountInfo = await client.auth.accountInfo(txInternal.from);
    const chainId = client.config.chainID;
    const signedTx = ''

    return signedTx;
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const terra = this.getClient();
    const x = await terra.tx.broadcastAsync(Tx.fromData(null));

    return x.txhash
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
    const balances = await client.bank.balance(address);

    return balances[1].total;
  }

  private getClient(): LCDClient {
    const terra = new LCDClient({
      URL: 'https://bombay-lcd.terra.dev',
      chainID: 'bombay-12',
    });

    return terra;
  }
}
