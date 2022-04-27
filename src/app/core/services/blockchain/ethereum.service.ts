import { Injectable } from '@angular/core';
import Web3 from 'web3';

import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { EthTransaction } from "../../models/eth-transaction";
import { ConfigService } from '../config/config.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root'
})
export class EthereumService extends BaseBlockchainClient implements IBlockchainClient {

  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(notification);
  }

  async buildRawTx(tx: Transaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
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
    });
  }

  async buildRawErc20Tx(tx: EthTransaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const from = this.addressToPublicKey(tx.from);
      const to = this.addressToPublicKey(tx.to);
      const web3 = this.getClient();
      const contract = this.getContractTransfer(web3, tx.contractAddress);
      const nonce = await web3.eth.getTransactionCount(from);
      const cfg = this.getConfig();
      const data = contract.methods.transfer(to, web3.utils.toWei(tx.amount.toString(), 'ether')).encodeABI();
      const ethTx = {
        from: from,
        to: tx.contractAddress,
        data: data,
        gasPrice: await web3.eth.getGasPrice(),
        gas: tx.feeOrGas,
        nonce: nonce,
        chainId: cfg.chainId,
      };

      return JSON.stringify(ethTx);
    });
  }

  async signRawTx(rawTx: string, pk: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const web3 = this.getClient();
      const txObject = JSON.parse(rawTx);
      const signedTx = await web3.eth.accounts.signTransaction(txObject, pk);

      return signedTx.rawTransaction;
    });
  }

  async submitSignedTx(rawTx: string): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const web3 = this.getClient();
      const response = await web3.eth.sendSignedTransaction(rawTx);

      return response.transactionHash;
    });
  }

  async isAddressValid(address: string): Promise<boolean> {
    const isAddress = this.validateAddress(address);
    return await Promise.resolve(isAddress);
  }

  async getBalance(address: string, contractAddress?: string): Promise<number> {
    return await this.tryExecuteAsync(async () => {
      const web3 = this.getClient();

      if (contractAddress) {
        const contract = this.getContractBalance(web3, contractAddress);
        const result = await contract.methods.balanceOf(address).call();
        return parseFloat(result);
      }

      const balance = await web3.eth.getBalance(this.addressToPublicKey(address));
      const eth = web3.utils.fromWei(balance);

      return parseFloat(eth);
    });
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

  protected getContractBalance(web3: Web3, contractAddress: string) {
    const contract = new web3.eth.Contract([{
      constant: true,
      inputs: [{
        name: "_owner",
        type: "address",
      },
      ],
      name: "balanceOf",
      outputs: [{
        name: "balance",
        type: "uint256",
      },
      ],
      type: "function",
    }], contractAddress);

    return contract;
  }

  protected getContractTransfer(web3: Web3, contractAddress: string) {
    const contract = new web3.eth.Contract([{
      constant: false,
      inputs: [{
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
      ],
      name: "transfer",
      outputs: [{
        name: "",
        type: "bool",
      },
      ],
      type: 'function',
    },], contractAddress);

    return contract;
  }
}

