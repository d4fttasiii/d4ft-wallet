import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, Observable, startWith } from 'rxjs';

import { Blockchains } from '../../../core/models/blockchains';
import { SVGLibraryService } from '../../../core/services';

class Option {
  blockchain: Blockchains;
  name: string;
}

@Component({
  selector: 'app-blockchain-selector',
  templateUrl: './blockchain-selector.component.html',
  styleUrls: ['./blockchain-selector.component.scss']
})
export class BlockchainSelectorComponent implements OnInit {

  @Output() blockchainSelected = new EventEmitter<Blockchains>();

  filteredOptions: Observable<Option[]>;
  myControl = new FormControl();
  options: Option[] = [
    { blockchain: Blockchains.Stellar, name: 'Stellar' },
    { blockchain: Blockchains.Ethereum, name: 'Ethereum' },
    { blockchain: Blockchains.Binance, name: 'Binance' },
    { blockchain: Blockchains.Polygon, name: 'Polygon' },
    { blockchain: Blockchains.Avalanche, name: 'Avalanche' },
    { blockchain: Blockchains.Harmony, name: 'Harmony' },
    { blockchain: Blockchains.Terra, name: 'Terra' },
    { blockchain: Blockchains.Solana, name: 'Solana' },
  ];

  constructor(private svgLib: SVGLibraryService) { }

  ngOnInit(): void {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value)),
    );
  }

  getIcon(blockchain: Blockchains): string {
    return this.svgLib.getBlockchainIcon(blockchain);
  }

  setBlockchain(event: MatAutocompleteSelectedEvent) {
    const name = event.option.value as string;
    const blockchain = this.options.find(o => o.name === name).blockchain;
    this.blockchainSelected.emit(blockchain);
  }

  private _filter(value: string): Option[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.name.toLowerCase().includes(filterValue));
  }
}
