import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { number } from 'bitcoinjs-lib/src/script';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

import BigNumber from 'bignumber.js';

@Component({
  selector: 'app-bignumber-amount-bar',
  templateUrl: './bignumber-amount-bar.component.html',
  styleUrls: ['./bignumber-amount-bar.component.scss']
})
export class BigNumberAmountBarComponent implements OnChanges {

  @Input() address: string;
  @Input() contractAddress?: string;
  @Input() client: IBlockchainClient;
  @Output() amountChanged = new EventEmitter<BigNumber>();

  amountFormControl = new FormControl('', [Validators.required]);
  balance: number;
  decimals: number;
  poweredDecimals: BigNumber;
  isLoading: boolean;
  maxValidator: ValidatorFn;
  floatValidator: ValidatorFn;
  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadBalance();
  }

  loadBalance() {
    if (!this.poweredDecimals) {
      this.decimals = this.client.getDecimalNumbers();
      this.poweredDecimals = new BigNumber(10).pow(this.decimals);
    }
    if (!this.address) {
      return;
    }
    this.isLoading = true;
    this.client.getBalance(this.address, this.contractAddress)
      .then(amount => {
        this.balance = amount;
        if (this.maxValidator) {
          this.amountFormControl.removeValidators(this.maxValidator);
        }
        this.maxValidator = Validators.max(amount);
        if (this.floatValidator) {
          console.log("removed");
          this.amountFormControl.removeValidators(this.floatValidator)
        }
        this.floatValidator = ((nbr) => {
          const val = new BigNumber(nbr.value);
          const isint = val.multipliedBy(this.poweredDecimals).isInteger();
          if (!val.isNaN() && !this.poweredDecimals.isNaN() && isint) {
            return null;
          }
          console.log("decimalExceed added");
          return {
            ["decimalExceed"]: "Decimals exceeded in sending amount!"
          }
        });
        this.amountFormControl.addValidators([this.maxValidator, this.floatValidator]);
        // this.amountFormControl.addValidators(this.floatValidator);
      })
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }

  onAmountChange(newAmount: string) {
    this.amountChanged.emit(new BigNumber(newAmount));
  }
}
