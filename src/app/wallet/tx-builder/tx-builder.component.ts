import { Component, OnInit } from '@angular/core';

import {  Blockchains } from '../../core/models/blockchains';
import { Transaction } from '../../core/models/transaction';
import { ClientFactoryService } from '../../core/services';
import { IBlockchainClient } from '../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-tx-builder',
  templateUrl: './tx-builder.component.html',
  styleUrls: ['./tx-builder.component.scss']
})
export class TxBuilderComponent implements OnInit {
  client: IBlockchainClient;
  selectedBlockchain: Blockchains;
  Blockchains = Blockchains;
  tx: Transaction;
  rawTx: string
  isLoading = false;
  minFeeOrGas = 0;

  constructor(private clientFactory: ClientFactoryService) { }

  ngOnInit(): void {
    this.tx = new Transaction();
  }

  build() {
    this.isLoading = true;
    this.client.buildRawTx(this.tx)
      .then(rawTx => this.rawTx = rawTx)
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }

  setSelectedBlockchain(blockchain: Blockchains) {
    this.selectedBlockchain = blockchain;
    this.client = this.clientFactory.getClient(this.selectedBlockchain);
    this.tx.feeOrGas = this.client.getMinFeeOrGas();
    this.minFeeOrGas = this.client.getMinFeeOrGas();
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
