import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-btc-tx-form',
  templateUrl: './btc-tx-form.component.html',
  styleUrls: ['./btc-tx-form.component.scss']
})
export class BtcTxFormComponent implements OnInit {

  @Input() client: IBlockchainClient;
  @Output() rawTxBuilt = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

}
