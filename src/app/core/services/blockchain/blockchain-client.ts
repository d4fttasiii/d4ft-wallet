import { StringMapWithRename } from '@angular/compiler/src/compiler_facade_interface';
import { Keypair } from '../../models/keypair';
import { Transaction } from '../../models/transaction';
import { NotificationService } from '../notification/notification.service';
import BigNumber from 'bignumber.js';
import { TokenMetaData } from '../../models/token-meta';

export interface IBlockchainClient {
  /**
   * 
   * @param tx custom transaction details object
   */
  buildRawTx(tx: any): Promise<string>;
  signRawTx(rawTx: string, pk: string): Promise<string>;
  generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair>;
  submitSignedTx(rawTx: string): Promise<string>;
  isAddressValid(address: string): Promise<boolean>;
  getBalance(address: string, contractAddress?: string): Promise<BigNumber>;
  getMinFeeOrGas(): number;
  getDerivationPath(): string;
  getDecimalNumbers(contractAddress?: string): Promise<TokenMetaData>;
}

export abstract class BaseBlockchainClient {
  abstract derivationkeypath: string;
  abstract decimals: number;
  abstract nativeSymbol: string;

  constructor(protected notification: NotificationService) {
  }

  getDerivationPath(): string {
    return this.derivationkeypath;
  }

  async getDecimalNumbers(contractAddress?: string): Promise<TokenMetaData> {
    return {
      decimals: this.decimals,
      symbol: this.nativeSymbol
    }
  }

  tryExecute<TResponse>(funcFn: () => TResponse): TResponse {
    try {
      return funcFn();
    } catch (error) {
      this.notification.error(error.message);
      throw new Error();
    }
  }

  async tryExecuteAsync<TResponse>(
    funcFn: () => Promise<TResponse>
  ): Promise<TResponse> {
    try {
      return await funcFn();
    } catch (error) {
      this.notification.error(error.message);
      throw new Error();
    }
  }
}
