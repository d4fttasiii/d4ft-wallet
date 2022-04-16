import { Transaction } from "./transaction";
import { EthTxMode } from "./eth-tx-mode";


export class EthTransaction extends Transaction {
    contractAddress: string;
    txMode: EthTxMode;

    isInvalid(): boolean {
        return super.isInvalid() && (!this.contractAddress && this.txMode === EthTxMode.Erc20);
    }
}
