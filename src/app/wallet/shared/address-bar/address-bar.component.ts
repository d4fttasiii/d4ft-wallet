import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';

@Component({
  selector: 'app-address-bar',
  templateUrl: './address-bar.component.html',
  styleUrls: ['./address-bar.component.scss']
})
export class AddressBarComponent implements OnInit {

  @Input() label: string;
  @Input() client: IBlockchainClient;
  @Input() addressFromParent?: string;
  @Output() addressChanged = new EventEmitter<string>();

  addressFormControl = new FormControl('', [Validators.required]);
  subject: Subject<string> = new Subject();
  address: string;
  hasValidated = false;
  isValid = false;
  isLoading = false;

  constructor() { }

  ngOnInit(): void {
    this.subject.pipe(debounceTime(1000)).subscribe(value => {
      this.loadDetails();
    });
  }

  onAddressChange(newAddress: string) {
    this.address = newAddress;
    this.subject.next(newAddress);
  }

  loadDetails() {
    if (!this.address) {
      this.addressChanged.emit(this.address);
      return;
    }
    this.isLoading = true;
    this.client.isAddressValid(this.address)
      .then((valid) => {
        this.isValid = valid;
        if (!this.isValid) {
          this.addressFormControl.setErrors({ invalid: true });
        } else {
          this.addressChanged.emit(this.address);
        }
      })
      .finally(() => {
        setTimeout(() => this.isLoading = false, 1000);
        this.hasValidated = true;
      });
  }
}
