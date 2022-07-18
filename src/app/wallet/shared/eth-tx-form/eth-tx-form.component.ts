import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import BigNumber from 'bignumber.js';
import { EthGasInfo } from '../../../core/models/eth-gas-info';

import { EthTransaction } from '../../../core/models/eth-transaction';
import { EthTxMode } from '../../../core/models/eth-tx-mode';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';
import { EthereumService } from '../../../core/services/blockchain/ethereum.service';

@Component({
  selector: 'app-eth-tx-form',
  templateUrl: './eth-tx-form.component.html',
  styleUrls: ['./eth-tx-form.component.scss']
})
export class EthTxFormComponent implements OnChanges {

  @Input() client: IBlockchainClient;
  @Output() rawTxBuilt = new EventEmitter<string>();

  EthTxMode = EthTxMode;
  ethTx: EthTransaction;
  gas_price_string: string;
  isLoading: boolean;
  minFeeOrGas = 21000;
  includeFeeToTx = false;
  estimated_fee: string;
  nativeSymbol: string;

  constructor() {
    this.ethTx = new EthTransaction();
  }

  ngOnChanges(changes: SimpleChanges): void {

    this.client.getFeeOrGasInfo().then(x => {
      this.ethTx.feeOrGas = x.gasLimit.toNumber();
    });
    this.ethTx.txMode = EthTxMode.Native;

  }

  rawTxReceived(rawTx: string) {
    this.rawTxBuilt.emit(rawTx);
  }

  removeContractAddressOnChange(any: any) {
    if (this.ethTx.txMode != any) {
      this.ethTx.contractAddress = null;
      this.updateGasInfo();
    }
  }

  setContract(contractAddress: string) {
    this.ethTx.contractAddress = contractAddress;
    this.updateGasInfo();
  }

  setFrom(address: string) {
    this.ethTx.from = address;
    this.updateGasInfo();
  }

  setTo(address: string) {
    this.ethTx.to = address;
    this.updateGasInfo();
  }

  setAmount(amount: BigNumber) {
    this.ethTx.amount = amount;
    this.updateGasInfo();
  }

  calculateFee(value: string) {
    const gasPrice = new BigNumber(value);
    if (gasPrice) {
      this.ethTx.gasPrice = gasPrice;
    }
    if (this.ethTx.feeOrGas) {
      this.estimated_fee = this.ethTx.gasPrice.multipliedBy(new BigNumber(this.ethTx.feeOrGas)).toString(10);
    }
  }

  updateGasInfo() {
    if (this.ethTx.amount && this.ethTx.from && this.ethTx.to) {
      this.client.getFeeOrGasInfo(this.ethTx).then(x => {
        const info = x as EthGasInfo;
        this.ethTx.feeOrGas = info.gasLimit.toNumber();
        this.minFeeOrGas = info.gasLimit.toNumber();
        this.client.getDecimalNumbers().then(x => {
          const powered = new BigNumber(10).pow(x.decimals);
          this.ethTx.gasPrice = info.gas_price.dividedBy(powered);
          this.gas_price_string = this.ethTx.gasPrice.toString(10);
          this.estimated_fee = this.ethTx.gasPrice.multipliedBy(this.ethTx.feeOrGas).toString(10);
          this.nativeSymbol = x.symbol;
        });
      })
    }
  }

  build() {
    this.isLoading = true;
    const q = this.ethTx.txMode === EthTxMode.Native ?
      this.client.buildRawTx(this.ethTx) :
      (this.client as EthereumService).buildRawErc20Tx(this.ethTx);

    q.then(rawTx => this.rawTxBuilt.emit(rawTx))
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }
}
