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

export class BitcoinTransaction extends Transaction {
    utxos: Utxo[];

    isInvalid(): boolean {
        return false; // super.isInvalid() && (this.utxos.length === 0);
    }
}

export class Utxo {
    txId: string;
    outputIndex: number;
    script: string;
    value: number;
}
