import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { EthTransaction, EthTxMode } from '../../../core/models/transaction';
import { EthereumService } from '../../../core/services/blockchain/ethereum.service';

@Component({
  selector: 'app-eth-tx-form',
  templateUrl: './eth-tx-form.component.html',
  styleUrls: ['./eth-tx-form.component.scss']
})
export class EthTxFormComponent implements OnChanges {

  @Input() client: EthereumService;
  @Output() rawTxBuilt = new EventEmitter<string>();

  EthTxMode = EthTxMode;

  ethTx: EthTransaction;
  isLoading: boolean;
  minFeeOrGas = 0;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.ethTx = new EthTransaction();
    this.ethTx.feeOrGas = this.client.getMinFeeOrGas();
    this.ethTx.txMode = EthTxMode.Native;
  }

  rawTxReceived(rawTx: string) {
    this.rawTxBuilt.emit(rawTx);
  }

  setContract(contractAddress: string) {
    this.ethTx.contractAddress = contractAddress;
  }

  setFrom(address: string) {
    this.ethTx.from = address;
  }

  setTo(address: string) {
    this.ethTx.to = address;
  }

  setAmount(amount: number) {
    this.ethTx.amount = amount;
  }

  build() {
    this.isLoading = true;
    const q = this.ethTx.txMode === EthTxMode.Native ?
      this.client.buildRawTx(this.ethTx) :
      this.client.buildRawErc20Tx(this.ethTx);

    q.then(rawTx => this.rawTxBuilt.emit(rawTx))
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }
}
