export class Transaction {
    from: string;
    to: string;
    amount: number;
    feeOrGas: number;
    memo?: string;

    protected isInvalid(): boolean {
        return !this.from || !this.to || !this.amount || !this.feeOrGas;
    }
}

export class EthTransaction extends Transaction {
    contractAddress: string;
    txMode: EthTxMode;

    protected isInvalid(): boolean {
        return super.isInvalid() && (!this.contractAddress && this.txMode === EthTxMode.Erc20);
    }
}

export enum EthTxMode {
    Native,
    Erc20,
}