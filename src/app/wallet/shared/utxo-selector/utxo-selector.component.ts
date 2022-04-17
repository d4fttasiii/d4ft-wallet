import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Utxo } from '../../../core/models/transaction';
import { BitcoinService } from '../../../core/services/blockchain/bitcoin.service';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

class SelectableUtxo extends Utxo {
  isSelected: boolean;
}

@Component({
  selector: 'app-utxo-selector',
  templateUrl: './utxo-selector.component.html',
  styleUrls: ['./utxo-selector.component.scss']
})
export class UtxoSelectorComponent implements OnChanges {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Input() address: string;
  @Input() client: IBlockchainClient;
  @Output() selectionChanged = new EventEmitter<Utxo[]>();

  displayedColumns: string[] = ['select', 'txId', 'value'];
  dataSource: MatTableDataSource<SelectableUtxo>;
  isLoading = false;

  constructor() {
    this.dataSource = new MatTableDataSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadUtxos();
  }

  isAllSelected(): boolean {
    return this.dataSource.data.some(u => !u.isSelected);
  }

  isAnySelected(): boolean {
    return this.dataSource.data.some(u => u.isSelected);
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.dataSource.data.forEach(u => u.isSelected = false);

    } else {
      this.dataSource.data.forEach(u => u.isSelected = true);
    }

    this.onUtxoSelectionChange();
  }

  loadUtxos() {
    if (!this.address) {
      return;
    }
    this.isLoading = true;
    (this.client as BitcoinService).getUtxos(this.address)
      .then(utxos => {
        this.dataSource = new MatTableDataSource(utxos as SelectableUtxo[]);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
      .finally(() => {
        setTimeout(() => this.isLoading = false, 1000);
      });
  }

  onUtxoSelectionChange() {
    const selected = this.dataSource.data.filter(u => u.isSelected);
    this.selectionChanged.emit(selected);
  }
}
