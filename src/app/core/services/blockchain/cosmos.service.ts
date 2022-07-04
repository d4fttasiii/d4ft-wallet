import { Injectable } from '@angular/core';
import { StargateClient, SigningStargateClient, parseCoins } from '@cosmjs/stargate';
import { DecodedTxRaw, DirectSecp256k1Wallet, OfflineSigner } from "@cosmjs/proto-signing";

import { Blockchains } from '../../models/blockchains';
import { CosmosConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import { Keypair } from '../../models/keypair';

class TxInternal {
  from: string;
  to: string;
  gas: number;
  fee: FeeInternal;
  uatomAmount: number;
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
export class CosmosService extends BaseBlockchainClient implements IBlockchainClient {

  derivationkeypath: string = "m/84'/118'/0'/0/0";

  constructor(private configService: ConfigService, protected notification: NotificationService) {
    super(notification);
  }
  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      throw new Error('Method not implemented.');
    });
  }

  buildRawTx(tx: Transaction): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(pk, 'hex')) as OfflineSigner;
    const client = await this.getSigningClient(wallet);
    return await this.tryExecuteAsync(async () => {
      const txInternal = JSON.parse(rawTx) as TxInternal;
      const signedTx = await client.sign(txInternal.from, [], {
        amount: parseCoins(txInternal.fee.amount), gas: txInternal.fee.gasLimit.toString(),
      }, txInternal.memo);

      return JSON.stringify(signedTx);
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const tx = JSON.parse(rawTx) as DecodedTxRaw;
    const client = await this.getClient();
    // client.broadcastTx(tx)
    return '';
  }

  async isAddressValid(address: string): Promise<boolean> {
    return true;
    try {
      const client = await this.getClient();
      await client.getAccount(address);
      return true;
    } catch {
      return false;
    }
  }

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    const client = await this.getClient();
    const atom = await client.getBalance(address, 'atom');

    return parseFloat(atom.amount);
  }

  getMinFeeOrGas(): number {
    return 150000;
  }

  private async getClient(): Promise<StargateClient> {
    const config = this.configService.get(Blockchains.Cosmos) as CosmosConfig;
    const client = await StargateClient.connect(config.endpoint);

    return client;
  }

  private async getSigningClient(wallet: OfflineSigner): Promise<SigningStargateClient> {
    const config = this.configService.get(Blockchains.Cosmos) as CosmosConfig;
    const client = await SigningStargateClient.connectWithSigner(config.endpoint, wallet);

    return client;
  }
}
