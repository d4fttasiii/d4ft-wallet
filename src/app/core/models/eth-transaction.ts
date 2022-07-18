import { Transaction } from "./transaction";
import { EthTxMode } from "./eth-tx-mode";
import BigNumber from "bignumber.js";


export class EthTransaction extends Transaction {
    contractAddress: string;
    txMode: EthTxMode;
    gasPrice: BigNumber

    isInvalid(): boolean {
        return super.isInvalid() || (!this.contractAddress && this.txMode === EthTxMode.Erc20);
    }
}
