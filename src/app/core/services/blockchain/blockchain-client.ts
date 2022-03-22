export interface IBlockchainClient {
    buildRawTx(from: string, to: string, amount: number): Promise<string>;
    signRawTx(rawTx: string, pk: string): string;
    submitSignedTx(rawTx: string): Promise<string>;
}