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

  hasSmartContracts(): boolean {
    return true;
  }

  protected async getContractBalance(address: string, contractAddress: string): Promise<number> {
    const web3 = this.getClient();
    const contract = this.getContract(web3, contractAddress);
    const balance = await contract.methods.balanceOf(address);
    const eth = web3.utils.fromWei(balance);

    return parseFloat(eth);
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

  protected getContract(web3: Web3, contractAddress: string) {
    const contract = new web3.eth.Contract([{
      type: 'function',
      constant: false,
      inputs: [
        {
          name: "_to",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
    }, {
      constant: true,
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          name: "balance",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    }], contractAddress);

    return contract;
  }
}

