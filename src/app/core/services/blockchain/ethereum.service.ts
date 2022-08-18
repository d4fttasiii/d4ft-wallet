import { Injectable } from '@angular/core';
import Web3 from 'web3';


import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { Transaction } from '../../models/transaction';
import { EthTransaction } from '../../models/eth-transaction';
import { ConfigService } from '../config/config.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import { NotificationService } from '../notification/notification.service';

import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
const bip32 = BIP32Factory(ecc);
import * as bip39 from 'bip39';
import { Keypair } from '../../models/keypair';
import BigNumber from 'bignumber.js';
import { AbiItem } from 'web3-utils';
import { TokenMetaData } from '../../models/token-meta';
import { EthGasInfo } from '../../models/eth-gas-info';

@Injectable({
  providedIn: 'root',
})
export class EthereumService extends BaseBlockchainClient implements IBlockchainClient {
  nativeSymbol: string = "ETH";
  decimals: number = 18;
  derivationkeypath = "m/84'/60'/0'/0/0";

  constructor(
    protected config: ConfigService,
    protected notification: NotificationService
  ) {
    super(notification);
  }

  override async getDecimalNumbers(contractAddress?: string): Promise<TokenMetaData> {
    return await this.tryExecuteAsync(async () => {
      if (contractAddress) {
        let decimals: number;
        let symbol: string = "???";
        try {
          const web3 = this.getClient();
          const contract = new web3.eth.Contract(this.abi, contractAddress);
          const result = await contract.methods.decimals().call();
          symbol = await contract.methods.symbol().call();
          decimals = parseInt(result);
          return { decimals: decimals, symbol: symbol };
        }
        catch {
          console.error("Failed to load erc-20 informations");
          if (typeof decimals === 'undefined') { throw new Error("Unable to get decimal informations for the given contract address") }
          return { decimals: decimals, symbol: symbol };
        }
      }
      return { decimals: this.decimals, symbol: this.nativeSymbol }
    });
  }

  async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      if (bip39.validateMnemonic(mnemonic)) {
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const root = bip32.fromSeed(seed);
        const keyPair = root.derivePath(
          keypath ? keypath : this.derivationkeypath
        );
        const pk = keyPair.privateKey.toString('hex');
        const account = this.getClient().eth.accounts.privateKeyToAccount(pk);
        return {
          privateKey: account.privateKey,
          publicAddress: account.address,
        };
      } else {
        throw new Error('Invalid mnemonic keypharse');
      }
    });
  }

  /**
   * Build legacy transaction (pre EIP-1559)
   * @param tx EthTransaction object with eth specific informations
   * @returns 
   */
  async buildRawTx(tx: EthTransaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const web3 = this.getClient();
      let gas = tx.feeOrGas;
      if (!tx.feeOrGas) {
        gas = await web3.eth.estimateGas({
          to: tx.to,
          from: tx.from,
          value: web3.utils.toWei(`${tx.amount.toString(10)}`, 'ether'),
        });
      }
      const gasPrice = (tx.gasPrice) ? web3.utils.toWei(tx.gasPrice.toString(10), 'ether') : await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(this.addressToPublicKey(tx.from));
      const cfg = this.getConfig();
      const ethTx = {
        from: this.addressToPublicKey(tx.from),
        to: this.addressToPublicKey(tx.to),
        value: web3.utils.toWei(tx.amount.toString(10), 'ether'),
        gasPrice: gasPrice,
        gas: gas,
        nonce: nonce,
        chainId: cfg.chainId,
      };

      return JSON.stringify(ethTx);
    });
  }

  /**
   * Build legacy transaction (pre EIP-1559)
   * @param tx EthTransaction object with eth specific informations
   * @returns 
   */
  async buildRawErc20Tx(tx: EthTransaction): Promise<string> {
    return await this.tryExecuteAsync(async () => {
      const from = this.addressToPublicKey(tx.from);
      const to = this.addressToPublicKey(tx.to);
      const web3 = this.getClient();
      const nonce = await web3.eth.getTransactionCount(from);
      const cfg = this.getConfig();
      const contract = new web3.eth.Contract(this.abi, tx.contractAddress)
      let gasPrice = await web3.eth.getGasPrice();
      if (tx.gasPrice) {
        gasPrice = web3.utils.toWei(tx.gasPrice.toString(10), 'ether')
      }
      const data = contract.methods
        .transfer(to, web3.utils.toWei(tx.amount.toString(10), 'ether'))
        .encodeABI();
      const ethTx = {
        from: from,
        to: tx.contractAddress,
        data: data,
        gasPrice: gasPrice,
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

  async getBalance(address: string, contractAddress?: string): Promise<BigNumber> {
    return await this.tryExecuteAsync(async () => {
      const web3 = this.getClient();

      if (contractAddress) {
        //const contract = this.getContractBalance(web3, contractAddress);
        const contract = new web3.eth.Contract(this.abi, contractAddress);
        const result = await contract.methods.balanceOf(address).call();
        const decimal = await contract.methods.decimals().call();
        return new BigNumber(result).dividedBy(new BigNumber(10).pow(decimal));
      }

      const balance = await web3.eth.getBalance(
        this.addressToPublicKey(address)
      );
      const eth = web3.utils.fromWei(balance);
      const bn = new BigNumber(eth);
      return bn;
    });
  }

  async getFeeOrGasInfo(tx?: any): Promise<any> {
    let result: EthGasInfo = new EthGasInfo();
    if (tx && tx.from && tx.to && tx.amount) {
      const web3 = this.getClient();
      const txdata = tx as EthTransaction;
      result.gas_price = new BigNumber(await web3.eth.getGasPrice());
      if (txdata.contractAddress) {
        const from = this.addressToPublicKey(tx.from);
        const contract = new web3.eth.Contract(this.abi, tx.contractAddress);
        result.gasLimit = new BigNumber(await contract.methods.transfer(txdata.to, web3.utils.toWei(tx.amount.toString(10), 'ether')).estimateGas({ from }));
        return result;
      }
      result.gasLimit = new BigNumber(await web3.eth.estimateGas({
        from: txdata.from,
        to: txdata.to,
        value: web3.utils.toHex(web3.utils.toWei(txdata.amount.toString(10), 'ether')),
      }));
      return result;
    }
    else {
      result.gasLimit = new BigNumber(21055);
      return result
    }
  }

  protected addressToPublicKey(address: string): string {
    return address;
  }

  protected validateAddress(address: string): boolean {
    const web3 = this.getClient();
    web3.utils.jsonInterfaceMethodToString
    return web3.utils.isAddress(address);
  }

  protected getClient(): Web3 {
    const cfg = this.getConfig();
    return new Web3(new Web3.providers.HttpProvider(cfg.url));
  }

  protected getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Ethereum) as EthereumConfig;
  }

  /**
     * erc20 abi (Abstract Binary Interface) 
     * https://ethereumdev.io/abi-for-erc20-contract-on-ethereum/
     * 
    */
  abi: AbiItem[] = [
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_spender",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_from",
          "type": "address"
        },
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "name": "",
          "type": "uint8"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        },
        {
          "name": "_spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    }
  ];
  //https://ethereumdev.io/abi-for-erc20-contract-on-ethereum/


}
