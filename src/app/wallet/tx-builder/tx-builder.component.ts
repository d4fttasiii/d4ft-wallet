import { Component, OnInit } from '@angular/core';

import { Blockchains } from '../../core/models/blockchains';
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
  rawTx: string

  constructor(private clientFactory: ClientFactoryService) { }

  ngOnInit(): void { }

  setSelectedBlockchain(blockchain: Blockchains) {
    this.selectedBlockchain = blockchain;
    this.client = this.clientFactory.getClient(this.selectedBlockchain);
  }

  setRawTx(rawTx: string) {
    this.rawTx = rawTx;
  }
}
