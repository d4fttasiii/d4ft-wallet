import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import BigNumber from 'bignumber.js';

import { EthTransaction } from '../../../core/models/eth-transaction';
import { EthTxMode } from '../../../core/models/eth-tx-mode';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';
import { EthereumService } from '../../../core/services/blockchain/ethereum.service';

@Component({
  selector: 'app-eth-tx-form',
  templateUrl: './eth-tx-form.component.html',
  styleUrls: ['./eth-tx-form.component.scss']
})
export class EthTxFormComponent implements OnChanges {

  @Input() client: IBlockchainClient;
  @Output() rawTxBuilt = new EventEmitter<string>();

  EthTxMode = EthTxMode;
  ethTx: EthTransaction;
  isLoading: boolean;
  minFeeOrGas = 0;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.ethTx = new EthTransaction();
    this.ethTx.feeOrGas = this.client.getMinFeeOrGas();
    this.ethTx.txMode = EthTxMode.Native;
  }

  rawTxReceived(rawTx: string) {
    this.rawTxBuilt.emit(rawTx);
  }

  removeContractAddressOnChange(any: any) {
    if (this.ethTx.txMode != any) {
      this.ethTx.contractAddress = null;
    }
  }

  setContract(contractAddress: string) {
    this.ethTx.contractAddress = contractAddress;
  }

  setFrom(address: string) {
    this.ethTx.from = address;
  }

  setTo(address: string) {
    this.ethTx.to = address;
  }

  setAmount(amount: BigNumber) {
    this.ethTx.amount = amount;
  }

  build() {
    this.isLoading = true;
    const q = this.ethTx.txMode === EthTxMode.Native ?
      this.client.buildRawTx(this.ethTx) :
      (this.client as EthereumService).buildRawErc20Tx(this.ethTx);

    q.then(rawTx => this.rawTxBuilt.emit(rawTx))
      .catch(error => console.error(error))
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }
}
