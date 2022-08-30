import BigNumber from 'bignumber.js';
export interface ITransaction {
    isInvalid(): boolean
}
export class Transaction implements ITransaction {
    from: string;
    to: string;
    amount: BigNumber;
    feeOrGas: number;
    memo?: string;

    isInvalid(): boolean {
        return !this.from || !this.to || !this.amount || !this.feeOrGas;
    }
}



export class CosmosTransaction implements ITransaction {
    feeOrGas: number;
    from: string;
    to: string;
    amount: BigNumber;
    gas: number;
    fee: number;
    memo?: string;
    isInvalid(): boolean {
        const ret = !this.from || !this.to || !this.amount || !this.gas || !(this.fee >= 0);
        return ret;
    }
}

export class BitcoinTransaction extends Transaction {
    utxos: Utxo[];

    isInvalid(): boolean {
        return super.isInvalid() || (this.utxos === null || this.utxos === undefined || this.utxos.length === 0);
    }
}

export class Utxo {
    txId: string;
    outputIndex: number;
    script: string;
    value: number;
}
