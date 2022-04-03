import { Component, OnInit } from '@angular/core';

import { Blockchains } from '../../core/models/blockchains';
import { ClientFactoryService } from '../../core/services';
import { IBlockchainClient } from '../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-tx-submit',
  templateUrl: './tx-submit.component.html',
  styleUrls: ['./tx-submit.component.scss']
})
export class TxSubmitComponent implements OnInit {
  client: IBlockchainClient;
  signedTx: string;
  Blockchains = Blockchains;
  txId: string;
  isLoading = false;
  errorMessage: string;

  constructor(private clientFactory: ClientFactoryService) { }

  ngOnInit(): void {
  }

  submit() {
    this.isLoading = true;
    this.client.submitSignedTx(this.signedTx)
      .then(txId => this.txId = txId)
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }

  setBlockchainClient(blockchain: Blockchains) {
    this.client = this.clientFactory.getClient(blockchain);
  }

}
