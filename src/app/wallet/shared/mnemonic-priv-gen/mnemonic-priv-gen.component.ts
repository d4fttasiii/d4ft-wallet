import { Component } from '@angular/core';

import { Blockchains } from '../../../core/models/blockchains';
import { Keypair } from '../../../core/models/keypair';
import { ClientFactoryService } from '../../../core/services';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-mnemonic-priv-gen',
  templateUrl: './mnemonic-priv-gen.component.html',
  styleUrls: ['./mnemonic-priv-gen.component.scss'],
})
export class MnemonicToPrivateKeyComponent {
  client: IBlockchainClient;
  unsignedTx: string;
  pk: string;
  mnemonic: string;
  keypath: string;
  keypair: Keypair;
  Blockchains = Blockchains;

  constructor(private clientFactory: ClientFactoryService) {}

  sign() {
    if(this.mnemonic){
      this.client
      .generatePrivateKeyFromMnemonic(this.mnemonic, this.keypath)
      .then((result) => (this.keypair = result));
    }
  }

  setSelectedBlockchain(blockchain: Blockchains) {
    this.client = this.clientFactory.getClient(blockchain);
    this.keypath = this.client.getDerivationPath();
  }
}
