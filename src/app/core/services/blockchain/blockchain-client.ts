import { Transaction } from '../../models/transaction';

export interface IBlockchainClient {
    buildRawTx(tx: Transaction): Promise<string>;
    signRawTx(rawTx: string, pk: string): Promise<string>;
    submitSignedTx(rawTx: string): Promise<string>;
    isAddressValid(address: string): Promise<boolean>;
    getBalance(address: string): Promise<number>;
    getMinFeeOrGas(): number;
    hasSmartContracts(): boolean;
}