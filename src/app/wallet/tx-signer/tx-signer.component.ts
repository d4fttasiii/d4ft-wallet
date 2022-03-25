import { Component } from '@angular/core';

import { AllBlockchains, Blockchains } from '../../core/models/blockchains';
import { ClientFactoryService } from '../../core/services';
import { IBlockchainClient } from '../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-tx-signer',
  templateUrl: './tx-signer.component.html',
  styleUrls: ['./tx-signer.component.scss']
})
export class TxSignerComponent {

  client: IBlockchainClient;
  unsignedTx: string;
  pk: string;
  signedTx: string;
  supportedBlockchains = AllBlockchains;
  Blockchains = Blockchains;

  constructor(private clientFactory: ClientFactoryService) { }

  sign() {
    this.client.signRawTx(this.unsignedTx, this.pk).then((signedTx) => this.signedTx = signedTx);
  }

  setSelectedBlockchain(blockchain: Blockchains) {
    this.client = this.clientFactory.getClient(blockchain);
  }
}
