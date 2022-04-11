import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';

import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-amount-bar',
  templateUrl: './amount-bar.component.html',
  styleUrls: ['./amount-bar.component.scss']
})
export class AmountBarComponent implements OnChanges {

  @Input() address: string;
  @Input() client: IBlockchainClient;
  @Output() amountChanged = new EventEmitter<number>();

  amountFormControl = new FormControl('', [Validators.required]);
  balance: number;
  isLoading: boolean;
  maxValidator: ValidatorFn;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadBalance();
  }

  loadBalance() {
    if (!this.address) {
      return;
    }
    this.isLoading = true;
    this.client.getBalance(this.address)
      .then(amount => {
        this.balance = amount;
        if (this.maxValidator) {
          this.amountFormControl.removeValidators(this.maxValidator);
        }
        this.maxValidator = Validators.max(amount);
        this.amountFormControl.addValidators(this.maxValidator);
      })
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }


  onAmountChange(newAmount: string) {
    this.amountChanged.emit(parseInt(newAmount, 10));
  }

}
