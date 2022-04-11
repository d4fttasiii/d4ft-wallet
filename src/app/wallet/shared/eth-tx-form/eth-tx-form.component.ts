import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Erc20Transaction } from '../../../core/models/transaction';
import { EthereumService } from '../../../core/services/blockchain/ethereum.service';

@Component({
  selector: 'app-eth-tx-form',
  templateUrl: './eth-tx-form.component.html',
  styleUrls: ['./eth-tx-form.component.scss']
})
export class EthTxFormComponent implements OnInit {

  @Input() client: EthereumService;
  @Output() rawTxBuilt = new EventEmitter<string>();

  contractTx: Erc20Transaction;

  constructor() { }

  ngOnInit(): void {
    this.contractTx = new Erc20Transaction();
  }

  rawTxReceived(rawTx: string) {
    this.rawTxBuilt.emit(rawTx);
  }

  setContract(contractAddress: string) {
    this.contractTx.contractAddress = contractAddress;
  }

  setFrom(address: string) {
    this.contractTx.from = address;
  }

  setTo(address: string) {
    this.contractTx.to = address;
  }

  setAmount(amount: number) {
    this.contractTx.amount = amount;
  }
}
