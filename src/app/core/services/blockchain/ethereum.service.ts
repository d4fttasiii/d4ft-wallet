import { Injectable } from '@angular/core';
import Web3 from 'web3';

import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { IBlockchainClient } from './blockchain-client';

@Injectable({
  providedIn: 'root'
})
export class EthereumService implements IBlockchainClient {

  constructor(protected config: ConfigService) { }

  async buildRawTx(tx: Transaction): Promise<string> {
    const web3 = this.getClient();
    const nonce = await web3.eth.getTransactionCount(this.addressToPublicKey(tx.from));
    const cfg = this.getConfig();
    const ethTx = {
      from: this.addressToPublicKey(tx.from),
      to: this.addressToPublicKey(tx.to),
      value: web3.utils.toWei(tx.amount.toString(), 'ether'),
      gasPrice: await web3.eth.getGasPrice(),
      gas: tx.feeOrGas,
      nonce: nonce,
      chainId: cfg.chainId,
    };

    return JSON.stringify(ethTx);
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    const web3 = this.getClient();
    const txObject = JSON.parse(rawTx);
    const signedTx = await web3.eth.accounts.signTransaction(txObject, pk);

    return signedTx.rawTransaction;
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    const web3 = this.getClient();
    const response = await web3.eth.sendSignedTransaction(rawTx);

    return response.transactionHash;
  }

  async isAddressValid(address: string): Promise<boolean> {
    const isAddress = this.validateAddress(address);
    return await Promise.resolve(isAddress);
  }

  async getBalance(address: string): Promise<number> {
    const web3 = this.getClient();
    const balance = await web3.eth.getBalance(this.addressToPublicKey(address));
    const eth = web3.utils.fromWei(balance);

    return parseFloat(eth);
  }

  getMinFeeOrGas(): number {
    return 21000;
  }

  protected addressToPublicKey(address: string): string {
    return address;
  }

  protected validateAddress(address: string): boolean {
    const web3 = this.getClient();
    return web3.utils.isAddress(address);
  }

  protected getClient(): Web3 {
    const cfg = this.getConfig();
    return new Web3(new Web3.providers.HttpProvider(cfg.url));
  }

  protected getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Ethereum) as EthereumConfig;
  }
}
