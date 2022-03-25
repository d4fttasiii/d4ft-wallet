export class Transaction {
    from: string;
    to: string;
    amount: number;

    isInvalid(): boolean {
        return !this.from || !this.to || !this.amount;
    }
}