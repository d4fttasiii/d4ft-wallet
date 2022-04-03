export class Transaction {
    from: string;
    to: string;
    amount: number;
    feeOrGas: number;
    memo?: string;

    isInvalid(): boolean {
        return !this.from || !this.to || !this.amount || !this.feeOrGas;
    }

    static from(from: string, to: string, amount: number, feeOrGas: number, memo = '') {
        const tx = new Transaction();
        tx.from = from;
        tx.to = to;
        tx.amount = amount;
        tx.feeOrGas = feeOrGas;
        tx.memo = memo;

        return tx;
    }
}