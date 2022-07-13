import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';
import BigNumber from 'bignumber.js';
import { StartLoggingOptions } from 'electron';


@Component({
  selector: 'app-amount-bar',
  templateUrl: './amount-bar.component.html',
  styleUrls: ['./amount-bar.component.scss']
})
export class AmountBarComponent implements OnChanges {

  @Input() address: string;
  @Input() contractAddress?: string;
  @Input() client: IBlockchainClient;
  @Output() amountChanged = new EventEmitter<BigNumber>();

  amountFormControl = new FormControl('', [Validators.required]);
  balance: BigNumber;
  balancestring: string;
  symbol?: string;
  isLoading: boolean;
  decimals: number;


  maxValidator: ValidatorFn;
  decimalValidator: ValidatorFn;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadBalance();
    this.loadTokenMetadata();
  }

  /**
   * Load decimals and symbol from client, and adjust the decimal-validator
   */
  private loadTokenMetadata() {
    this.isLoading = true;
    this.client.getDecimalNumbers(this.contractAddress).then(x => {
      this.decimals = x.decimals;
      this.symbol = x.symbol;
      const powered = new BigNumber(10).pow(new BigNumber(this.decimals));

      if (this.decimalValidator) {
        this.amountFormControl.removeValidators(this.decimalValidator);
      }

      this.decimalValidator = (nbr => {
        const val = new BigNumber(nbr.value);
        const isint = val.multipliedBy(powered).isInteger();
        if (!val.isNaN() && !powered.isNaN() && isint) {
          return null;
        }
        return { ["decimalExceed"]: "Decimals exceeded in sending amount!" };
      });
      this.amountFormControl.addValidators(this.decimalValidator);
    }).finally(() => setTimeout(() => this.isLoading = false, 1000));
  }

  /**
  * Load the balance and adjust the max-validator
  */
  loadBalance() {
    if (!this.address) {
      return;
    }
    this.isLoading = true;
    this.client.getBalance(this.address, this.contractAddress)
      .then(amount => {
        this.balance = amount;
        this.balancestring = amount.toString(10);
        if (this.maxValidator) {
          this.amountFormControl.removeValidators(this.maxValidator);
        }
        this.maxValidator = ((nbr) => {
          const bn = new BigNumber(nbr.value);
          if (amount.gte(bn)) {
            return null;
          }
          return { ["max"]: "max balance amount exceeded" };
        });
        this.amountFormControl.addValidators(this.maxValidator);
      })
      .finally(() => setTimeout(() => this.isLoading = false, 1000));
  }

  onAmountChange(newAmount: string) {
    this.amountChanged.emit(new BigNumber(newAmount));
  }

}
