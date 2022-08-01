import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { Transaction } from '../../../core/models/transaction';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-dot-tx-form',
  templateUrl: './dot-tx-form.component.html',
  styleUrls: ['./dot-tx-form.component.scss']
})
export class DotTxFormComponent implements OnChanges {

  @Input() client: IBlockchainClient;
  @Output() rawTxBuilt = new EventEmitter<string>();
  tx: Transaction;
  isLoading: boolean;
  minFeeOrGas = 0;
  decimals: number;
  nativeSymbol: string;
  poweredDecimals: BigNumber;
  feeEstimationLoading: boolean;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.tx = new Transaction();
    this.client.getDecimalNumbers().then((x) => {
      this.decimals = x.decimals;
      this.nativeSymbol = x.symbol;
      this.poweredDecimals = new BigNumber(10).pow(x.decimals);
      this.client.getFeeOrGasInfo().then(x => {
        this.tx.feeOrGas = this.toNative(new BigNumber(x));
      });
    });
  }

  toNative(amount: BigNumber): number {
    if (typeof (amount) === "string") {
      amount = new BigNumber(amount);
    }
    return amount.dividedBy(this.poweredDecimals).toNumber();
  }

  build() {
    this.isLoading = true;
    this.client.buildRawTx(this.tx)
      .then(rawTx => this.rawTxBuilt.emit(rawTx))
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 5000));
  }

  updateGasInfo() {
    if (this.tx.amount && this.tx.to && this.tx.from) {
      this.feeEstimationLoading = true;
      this.client.getFeeOrGasInfo(this.tx).then((x) => {
        this.tx.feeOrGas = this.toNative(new BigNumber(x));
        this.feeEstimationLoading = false;
      }).finally(() => setTimeout(() => this.feeEstimationLoading = false, 10000));
    }
  }

  setFrom(address: string) {
    this.tx.from = address;
    this.updateGasInfo();
  }

  setTo(address: string) {
    this.tx.to = address;
    this.updateGasInfo();
  }

  setAmount(amount: BigNumber) {
    this.tx.amount = amount;
    this.updateGasInfo();
  }

}
