import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { Blockchains } from '../../../core/models/blockchains';
import { SVGLibraryService } from '../../../core/services';

@Component({
  selector: 'app-blockchain-selector',
  templateUrl: './blockchain-selector.component.html',
  styleUrls: ['./blockchain-selector.component.scss']
})
export class BlockchainSelectorComponent implements OnInit {

  @Output() blockchainSelected = new EventEmitter<Blockchains>();

  Blockchains = Blockchains;
  supportedBlockchains: Blockchains[];

  constructor(private svgLib: SVGLibraryService) { }

  ngOnInit(): void {
    this.supportedBlockchains = [
      Blockchains.Stellar,
      Blockchains.Ethereum,
    ];
  }

  getIcon(blockchain: Blockchains): string {
    return this.svgLib.getBlockchainIcon(blockchain);
  }

  setBlockchain(matSelectChange: MatSelectChange) {
    const blockchain = matSelectChange.value as Blockchains;
    this.blockchainSelected.emit(blockchain);
  }
}
