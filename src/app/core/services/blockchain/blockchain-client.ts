import { Keypair } from '../../models/keypair';
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
  /**
   * Can be use to set default gas/gasprice/fee values on ui and estimate transaction fee using the given transaction
   * @param tx The transaction object with values to estimate
   */
  getFeeOrGasInfo(tx?: any): Promise<any>;
  getDerivationPath(): string;
  getDecimalNumbers(contractAddress?: string): Promise<TokenMetaData>;
}

export abstract class BaseBlockchainClient {
  abstract derivationkeypath: string;
  /**
   * native asset decimal numbers
   */
  abstract decimals: number;
  abstract nativeSymbol: string;

  constructor(protected notification: NotificationService) {
  }

  getDerivationPath(): string {
    return this.derivationkeypath;
  }

  /**
   * Returns the native/contract token metadata - (decimals: number, symbol:string)
   * @param contractAddress 
   * @returns 
   */
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
