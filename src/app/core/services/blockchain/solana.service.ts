import { Injectable } from '@angular/core';
import * as web3 from '@solana/web3.js';
import * as bs58 from 'bs58';

import { Blockchains } from '../../models/blockchains';
import { SolanaConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { IBlockchainClient } from './blockchain-client';

@Injectable({
  providedIn: 'root'
})
export class SolanaService implements IBlockchainClient {

  constructor(private config: ConfigService) { }

  async buildRawTx(tx: Transaction): Promise<string> {
    const client = this.getClient();
    const from = new web3.PublicKey(tx.from);
    const to = new web3.PublicKey(tx.to);
    const recentBlock = await client.getLatestBlockhash();

    const transaction = new web3.Transaction();
    transaction.add(
      web3.SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: tx.amount * web3.LAMPORTS_PER_SOL,
      }),
    );
    transaction.recentBlockhash = recentBlock.blockhash;
    transaction.feePayer = from;

    return transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    }).toString('hex');
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const keypair = web3.Keypair.fromSecretKey(bs58.decode(pk));
    const tx = web3.Transaction.from(Buffer.from(rawTx, 'hex'));
    tx.sign(keypair);

    return await Promise.resolve(tx.serialize().toString('hex'));
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const client = this.getClient();
    const signature = await client.sendRawTransaction(Buffer.from(rawTx, 'hex'));

    return signature;
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

  async getBalance(address: string): Promise<number> {
    const client = this.getClient();
    const pubk = new web3.PublicKey(address);
    const balance = await client.getBalance(pubk);

    return balance / web3.LAMPORTS_PER_SOL;
  }

  getMinFeeOrGas(): number {
    return web3.LAMPORTS_PER_SOL * 0.00005;
  }

  private getClient(): web3.Connection {
    const cfg = this.config.get(Blockchains.Solana) as SolanaConfig;

    return new web3.Connection(
      web3.clusterApiUrl(cfg.cluster),
      'confirmed',
    );
  }
}
