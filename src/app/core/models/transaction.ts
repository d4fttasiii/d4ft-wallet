export class Transaction {
    from: string;
    to: string;
    amount: number;
    feeOrGas: number;
    memo?: string;

    isInvalid(): boolean {
        return !this.from || !this.to || !this.amount || !this.feeOrGas;
    }
}