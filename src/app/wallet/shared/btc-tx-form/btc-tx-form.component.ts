import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { BitcoinTransaction, Utxo } from '../../../core/models/transaction';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-btc-tx-form',
  templateUrl: './btc-tx-form.component.html',
  styleUrls: ['./btc-tx-form.component.scss']
})
export class BtcTxFormComponent implements OnChanges {
 
  @Input() client: IBlockchainClient;
  @Output() rawTxBuilt = new EventEmitter<string>();
  tx: BitcoinTransaction;
  isLoading: boolean;
  minFeeOrGas = 0;

  constructor() { }
  
  ngOnChanges(changes: SimpleChanges): void {
    this.tx = new BitcoinTransaction();
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

  setUtxos(utxos: Utxo[]){
    this.tx.utxos = utxos;
  }

}
