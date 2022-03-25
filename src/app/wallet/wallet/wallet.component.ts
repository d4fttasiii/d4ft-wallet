import { Component, OnInit } from '@angular/core';

import { Blockchains } from '../../core/models/blockchains';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {

  supportedBlockchains: Blockchains[] = [Blockchains.Stellar];
  Blockchains = Blockchains;

  selectedBlockchain: Blockchains;
  from: string;
  to: string;
  amount: number;

  constructor() { }

  ngOnInit(): void {
  }

}
