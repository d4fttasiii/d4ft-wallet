import { Injectable } from '@angular/core';
import {
  Asset,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

import { IBlockchainClient } from './blockchain-client';

@Injectable({
  providedIn: 'root',
})
export class StellarService implements IBlockchainClient {
  constructor() {}

  async buildRawTx(from: string, to: string, amount: number): Promise<string> {
    const srv = this.getServer();
    const fromAccount = await srv.loadAccount(from);
    const toAccount = Keypair.fromPublicKey(to);
    const txBuilder = new TransactionBuilder(fromAccount);
    const accountExists = await this.accountExists(to);

    if (accountExists) {
      txBuilder.addOperation(
        Operation.payment({
          amount: amount.toString(),
          asset: Asset.native(),
          source: fromAccount.accountId(),
          destination: toAccount.publicKey(),
        })
      );
    } else {
      txBuilder.addOperation(
        Operation.createAccount({
          destination: toAccount.publicKey(),
          startingBalance: amount.toString(),
          source: fromAccount.accountId(),
        })
      );
    }

    return txBuilder.build().toXDR();
  }

  signRawTx(rawTx: string, pk: string): string {
    const tx = TransactionBuilder.fromXDR(rawTx, Networks.PUBLIC);
    const keypair = Keypair.fromSecret(pk);
    tx.sign(keypair);

    return tx.toXDR();
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const srv = this.getServer();
    const tx = TransactionBuilder.fromXDR(rawTx, Networks.PUBLIC);
    const txResponse = await srv.submitTransaction(tx);

    return txResponse.hash;
  }

  private async accountExists(address: string): Promise<boolean> {
    try {
      const srv = this.getServer();
      await srv.loadAccount(address);
      return true;
    } catch {
      return false;
    }
  }

  private getServer(): Server {
    return new Server('https://horizon.stellar.org/', {
      allowHttp: false,
    });
  }
}
