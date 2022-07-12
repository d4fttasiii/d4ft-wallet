import { AfterViewChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { CosmosTransaction, Transaction } from '../../../core/models/transaction';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';
import { CosmosService } from '../../../core/services/blockchain/cosmos.service';
import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-cosmos-tx-form',
  templateUrl: './cosmos-tx-form.component.html',
  styleUrls: ['./cosmos-tx-form.component.scss']
})
export class CosmosTxFormComponent implements OnChanges {

  @Input() client: IBlockchainClient;
  @Output() rawTxBuilt = new EventEmitter<string>();
  tx: CosmosTransaction;
  isLoading: boolean;
  minGas = 200000;
  minFee = 0;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.tx = new CosmosTransaction();
    this.tx.gas = (this.client as CosmosService).getMaxGas();
    this.tx.fee = (this.client as CosmosService).getDefaultFee();
  }

  build() {
    this.isLoading = true;
    this.client.buildRawTx(this.tx)
      .then(rawTx => this.rawTxBuilt.emit(rawTx))
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 5000));
  }

  setFrom(address: string) {
    this.tx.from = address;
  }

  setTo(address: string) {
    this.tx.to = address;
  }

  setAmount(amount: BigNumber) {
    this.tx.amount = new BigNumber(amount);
  }

  setFee(fee: number) {
    this.tx.fee = fee;
  }

}
