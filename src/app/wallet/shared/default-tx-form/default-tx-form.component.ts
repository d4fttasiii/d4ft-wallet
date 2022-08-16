import { AfterViewChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { Transaction } from '../../../core/models/transaction';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-default-tx-form',
  templateUrl: './default-tx-form.component.html',
  styleUrls: ['./default-tx-form.component.scss']
})
export class DefaultTxFormComponent implements OnChanges {

  @Input() client: IBlockchainClient;
  @Output() rawTxBuilt = new EventEmitter<string>();
  tx: Transaction;
  isLoading: boolean;
  minFeeOrGas = 0;
  feeEstimationLoading = false;
  decimals: number;
  nativeSymbol: string;
  poweredDecimals: BigNumber;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.tx = new Transaction();
    this.client.getDecimalNumbers().then((x) => {
      this.decimals = x.decimals;
      this.nativeSymbol = x.symbol;
      this.poweredDecimals = new BigNumber(10).pow(x.decimals);
      this.client.getFeeOrGasInfo().then(x => {
        this.tx.feeOrGas = x; //smallest unit
      });
    });

  }

  build() {
    this.isLoading = true;
    this.client.buildRawTx(this.tx)
      .then(rawTx => {
        this.rawTxBuilt.emit(rawTx)
        this.isLoading = false;
      })
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 5000));
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

  updateGasInfo() {
    if (this.tx.amount && this.tx.to && this.tx.from) {
      this.feeEstimationLoading = true;
      this.client.getFeeOrGasInfo(this.tx).then((x) => {
        this.tx.feeOrGas = x;
        this.feeEstimationLoading = false;
      }).finally(() => setTimeout(() => this.feeEstimationLoading = false, 10000));
    }
  }

  toNative(amount: BigNumber | string | number): number {
    if (typeof (amount) === "string" || typeof (amount) === "number") {
      amount = new BigNumber(amount);
    }
    return amount.dividedBy(this.poweredDecimals).toNumber();
  }
}
