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

export class BitcoinTransaction extends Transaction {
    utxos: Utxo[];
}

export class Utxo {
    txId: string;
    address: string;
    outputIndex: number;
    script: string;
    value: number;
}
