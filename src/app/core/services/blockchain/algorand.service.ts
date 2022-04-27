import { Injectable } from '@angular/core';
import algosdk, { decodeSignedTransaction } from 'algosdk';

import { Blockchains } from '../../models/blockchains';
import { AlgorandConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';

@Injectable({
  providedIn: 'root'
})
export class AlgorandService extends BaseBlockchainClient implements IBlockchainClient {

  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(notification);
  }

  async buildRawTx(tx: Transaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const client = this.getAlgodClient();
      let params = await client.getTransactionParams().do();
      params.fee = tx.feeOrGas;
      params.flatFee = true;

      const algoTx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: algosdk.algosToMicroalgos(tx.amount),
        from: tx.from,
        to: tx.to,
        note: tx.memo ? new TextEncoder().encode(tx.memo) : undefined,
        suggestedParams: params,
      });
      const encodedTx = Buffer.from(algosdk.encodeUnsignedTransaction(algoTx)).toString('hex');

      return encodedTx;
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const tx = algosdk.decodeUnsignedTransaction(Buffer.from(rawTx, 'hex'));
      const secretkey = algosdk.mnemonicToSecretKey(pk);
      const signedTxBytes = tx.signTxn(secretkey.sk);

      return Buffer.from(signedTxBytes).toString('hex');
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const signedTxHex = Buffer.from(rawTx, 'hex');
      const signedTx = decodeSignedTransaction(signedTxHex);
      const txId = signedTx.txn.txID();
      const client = this.getAlgodClient();
      await client.sendRawTransaction(signedTxHex).do();
      await algosdk.waitForConfirmation(client, txId, 4);

      return txId;
    });
  }

  async isAddressValid(address: string): Promise<boolean> {
    return await Promise.resolve(algosdk.isValidAddress(address));
  }

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    try {
      const client = this.getAlgodClient();
      const accountInfo = await client.accountInformation(address).do();
      return algosdk.microalgosToAlgos(accountInfo.amount);
    }
    catch {
      return 0;
    }
  }

  getMinFeeOrGas(): number {
    return 1000;
  }

  private getAlgodClient() {
    const cfg = this.getConfig();
    const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const client = new algosdk.Algodv2(algodToken, cfg.algodServer, cfg.algodPort);

    return client;
  }

  private getIndxrClient() {
    const cfg = this.getConfig();
    const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const client = new algosdk.Indexer(algodToken, cfg.indxrServer, cfg.indxrPort)

    return client;
  }

  private getConfig(): AlgorandConfig {
    return this.config.get(Blockchains.Algorand) as AlgorandConfig;
  }
}
