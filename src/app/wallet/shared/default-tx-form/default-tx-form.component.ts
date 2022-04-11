import { AfterViewChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { Transaction } from '../../../core/models/transaction';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

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

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.tx = new Transaction();
    this.tx.feeOrGas = this.client.getMinFeeOrGas();
  }
  
  build() {
    this.isLoading = true;
    this.client.buildRawTx(this.tx)
      .then(rawTx => this.rawTxBuilt.emit(rawTx))
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }
  
  setFrom(address: string) {
    this.tx.from = address;
  }

  setTo(address: string) {
    this.tx.to = address;
  }

  setAmount(amount: number) {
    this.tx.amount = amount;
  }

}
