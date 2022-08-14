import { Injectable } from '@angular/core';
import * as web3 from '@solana/web3.js';
import * as bs58 from 'bs58';

import { Blockchains } from '../../models/blockchains';
import { SolanaConfig } from '../../models/config';
import { Keypair } from '../../models/keypair';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import BigNumber from 'bignumber.js';
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "bip39";


@Injectable({
  providedIn: 'root'
})
export class SolanaService extends BaseBlockchainClient implements IBlockchainClient {
  nativeSymbol: string = "SOL";
  decimals: number = 9;
  derivationkeypath: string = "m/44'/501'/0'/0'";
  constructor(private config: ConfigService, protected notification: NotificationService) {
    super(notification);
  }
  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      const seed = bip39.mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
      const keypair = web3.Keypair.fromSeed(
        derivePath(keypath, seed.toString("hex")).key
      );
      return {
        privateKey: bs58.encode(keypair.secretKey),
        publicAddress: keypair.publicKey.toBase58()
      }
    });
  }

  async buildRawTx(tx: Transaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const client = this.getClient();
      const from = new web3.PublicKey(tx.from);
      const to = new web3.PublicKey(tx.to);
      const recentBlock = await client.getLatestBlockhash();

      const transaction = new web3.Transaction();
      const lamports = tx.amount.multipliedBy(new BigNumber(web3.LAMPORTS_PER_SOL));
      if (!lamports.isInteger()) {
        throw Error("The transaction amount is exceeded the max decimals: " + this.decimals)
      }

      transaction.add(
        web3.SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports: lamports.toNumber(),
        }),
      );
      transaction.recentBlockhash = recentBlock.blockhash;
      transaction.feePayer = from;

      return transaction.serialize({
        verifySignatures: false,
        requireAllSignatures: false,
      }).toString('hex');
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const keypair = web3.Keypair.fromSecretKey(bs58.decode(pk));
      const tx = web3.Transaction.from(Buffer.from(rawTx, 'hex'));
      tx.sign(keypair);

      return tx.serialize().toString('hex');
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const client = this.getClient();
      const signature = await client.sendRawTransaction(Buffer.from(rawTx, 'hex'));

      return signature;
    });
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      const pubk = new web3.PublicKey(address);
      return await Promise.resolve(true);
    }
    catch {
      return false;
    }
  }

  async getBalance(address: string, contractAddress?: string): Promise<BigNumber> {
    return await this.tryExecuteAsync(async () => {
      const client = this.getClient();
      const pubk = new web3.PublicKey(address);
      const balance = await client.getBalance(pubk);
      return new BigNumber(balance).dividedBy(new BigNumber(web3.LAMPORTS_PER_SOL));
    });
  }

  async getFeeOrGasInfo(tx?: any): Promise<any> {
    if (tx) {
      const client = this.getClient();
      const from = new web3.PublicKey(tx.from);
      const to = new web3.PublicKey(tx.to);
      const transaction = new web3.Transaction();
      transaction.add(
        web3.SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports: web3.LAMPORTS_PER_SOL * 1,
        })
      );
      const { blockhash } = await client.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = from;
      const feeForMessage = await client.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      const feeInLamports = feeForMessage.value;
      const fee = feeInLamports;
      return fee;
    }
    return web3.LAMPORTS_PER_SOL * 0.000005;
  }

  hasSmartContracts(): boolean {
    return false;
  }

  private getClient(): web3.Connection {
    const cfg = this.config.get(Blockchains.Solana) as SolanaConfig;

    return new web3.Connection(
      web3.clusterApiUrl(cfg.cluster),
      'confirmed',
    );
  }
}
