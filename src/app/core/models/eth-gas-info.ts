import BigNumber from "bignumber.js";

export class EthGasInfo {
    /**
     * calculated fee for the transaction
     */
    calculatedFee: string;
    /**
     * gas amount 
     */
    gasLimit: BigNumber;
    /**
     * the gas price in native token
     */
    gas_price: BigNumber
    /**
     * minimum gas amount
     */
    minimum_gas: BigNumber
}