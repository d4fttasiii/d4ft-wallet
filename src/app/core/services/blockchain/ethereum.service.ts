import { Injectable } from '@angular/core';
import Web3 from 'web3';

import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { ConfigService } from '../config/config.service';
import { IBlockchainClient } from './blockchain-client';

@Injectable({
  providedIn: 'root'
})
export class EthereumService implements IBlockchainClient {

  constructor(protected config: ConfigService) { }

  async buildRawTx(from: string, to: string, amount: number): Promise<string> {
    const web3 = this.getClient();
    const nonce = await web3.eth.getTransactionCount(from);
    const cfg = this.getConfig();
    const tx = {
      from: from,
      to: to,
      value: web3.utils.toWei(amount.toString(), 'ether'),
      gasPrice: await web3.eth.getGasPrice(),
      gas: 21000,
      nonce: nonce,
      chainId: cfg.chainId,
    };

    return JSON.stringify(tx);
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
    const web3 = this.getClient();
    const isAddress = web3.utils.isAddress(address);

    return await Promise.resolve(isAddress);
  }

  async getBalance(address: string): Promise<number> {
    const web3 = this.getClient();
    const balance = await web3.eth.getBalance(address);
    const eth = web3.utils.fromWei(balance);

    return parseFloat(eth);
  }

  protected getClient(): Web3 {
    const cfg = this.getConfig();
    return new Web3(new Web3.providers.HttpProvider(cfg.url));
  }

  protected getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Ethereum) as EthereumConfig;
  }
}
