import { Component, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { AllBlockchains, Blockchains } from '../../core/models/blockchains';
import { ClientFactoryService } from '../../core/services';
import { IBlockchainClient } from '../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-tx-signer',
  templateUrl: './tx-signer.component.html',
  styleUrls: ['./tx-signer.component.scss']
})
export class TxSignerComponent implements OnInit {

  client: IBlockchainClient;
  unsignedTx: string;
  pk: string = "SBX5SWPDN3GA62JZTVDALUUW7ZPBTGRI2KGPKRZTNRF6IV5RHHIXK2MD";
  signedTx: string;
  supportedBlockchains = AllBlockchains;
  Blockchains = Blockchains;

  constructor(private clientFactory: ClientFactoryService) { }

  ngOnInit(): void {
  }

  sign() {
    this.signedTx = this.client.signRawTx(this.unsignedTx, this.pk);
  }

  setBlockchainClient(event: MatSelectChange) {
    this.client = this.clientFactory.getClient(event.value as Blockchains);
  }

}
