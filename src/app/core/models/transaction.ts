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

export class Erc20Transaction extends Transaction {
    contractAddress: string;

    protected isInvalid(): boolean {
        return super.isInvalid() || !this.contractAddress;
    }
}