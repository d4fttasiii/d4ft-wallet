import { Injectable } from '@angular/core';
import * as StellarSdk from 'stellar-sdk';
import { Keypair } from '../../models/keypair';

import { Transaction } from '../../models/transaction';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import BigNumber from 'bignumber.js';
import { ConfigService } from '../config/config.service';
import { Blockchains } from '../../models/blockchains';
import { StellarConfig } from '../../models/config';
import { validateMnemonic, mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

@Injectable({
  providedIn: 'root',
})
export class StellarService extends BaseBlockchainClient implements IBlockchainClient {
  nativeSymbol: string = "XLM";
  decimals: number = 7;
  derivationkeypath: string = "m/44'/148'/0'";
  constructor(private config: ConfigService, protected notification: NotificationService) {
    super(notification);
  }
  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      if (validateMnemonic(mnemonic)) {
        const seed = await mnemonicToSeed(mnemonic);
        const result = derivePath(keypath ? keypath : this.derivationkeypath, seed.toString("hex"));
        const keypair = StellarSdk.Keypair.fromRawEd25519Seed(Buffer.from(result.key));
        return {
          privateKey: keypair.secret(),
          publicAddress: keypair.publicKey(),
        };
      } else {
        throw new Error('Invalid mnemonic keypharse');
      }
    });
  }

  async buildRawTx(tx: Transaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const srv = this.getServer();
      const fromAccount = await srv.loadAccount(tx.from);
      const toAccount = StellarSdk.Keypair.fromPublicKey(tx.to);
      const txBuilder = new StellarSdk.TransactionBuilder(fromAccount, { fee: tx.feeOrGas.toString() });
      console.log("before exists")
      const accountExists = await this.accountExists(tx.to);
      console.log("after exists")

      if (accountExists) {
        txBuilder.addOperation(
          StellarSdk.Operation.payment({
            amount: tx.amount.toString(),
            asset: StellarSdk.Asset.native(),
            source: fromAccount.accountId(),
            destination: toAccount.publicKey(),
          })
        );
      } else {
        txBuilder.addOperation(
          StellarSdk.Operation.createAccount({
            destination: toAccount.publicKey(),
            startingBalance: tx.amount.toString(),
            source: fromAccount.accountId(),
          })
        );
      }

      if (tx.memo) {
        txBuilder.addMemo(new StellarSdk.Memo('text', tx.memo));
      }

      return txBuilder
        .setTimeout(StellarSdk.TimeoutInfinite)
        .setNetworkPassphrase(StellarSdk.Networks.TESTNET)
        .build()
        .toXDR();
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const keypair = StellarSdk.Keypair.fromSecret(pk);
      const tx = StellarSdk.TransactionBuilder.fromXDR(rawTx, StellarSdk.Networks.TESTNET);
      tx.sign(keypair);

      return await Promise.resolve(tx.toXDR());
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const srv = this.getServer();
      const tx = StellarSdk.TransactionBuilder.fromXDR(rawTx, StellarSdk.Networks.TESTNET);
      const txResponse = await srv.submitTransaction(tx);

      return txResponse.hash;
    });
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      StellarSdk.Keypair.fromPublicKey(address);
      return await Promise.resolve(true);
    } catch {
      return await Promise.resolve(false);
    }
  }

  async getBalance(address: string, contractAddress?: string): Promise<BigNumber> {
    try {
      const srv = this.getServer();
      const account = await srv.loadAccount(address);
      return new BigNumber(account.balances.find(b => b.asset_type === 'native').balance);
    } catch {
      return new BigNumber(0);
    }
  }

  async getFeeOrGasInfo(tx?: any): Promise<any> {
    return 1000;
  }

  hasSmartContracts(): boolean {
    return false;
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

  private getServer(): StellarSdk.Server {
    const cfg = this.config.get(Blockchains.Stellar) as StellarConfig;
    return new StellarSdk.Server(cfg.url, {
      allowHttp: false,
    });
  }
}
