export interface IBlockchainClient {
    buildRawTx(from: string, to: string, amount: number): Promise<string>;
    signRawTx(rawTx: string, pk: string): Promise<string>;
    submitSignedTx(rawTx: string): Promise<string>;
    isAddressValid(address: string): Promise<boolean>;
    getBalance(address: string): Promise<number>;
}