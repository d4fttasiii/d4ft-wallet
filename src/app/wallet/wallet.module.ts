import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';
import { AddressBarComponent } from './shared/address-bar/address-bar.component';
import { AmountBarComponent } from './shared/amount-bar/amount-bar.component';
import { TxBuilderComponent } from './tx-builder/tx-builder.component';
import { TxSignerComponent } from './tx-signer/tx-signer.component';
import { TxSubmitComponent } from './tx-submit/tx-submit.component';
import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet/wallet.component';


@NgModule({
  declarations: [
    WalletComponent,
    TxBuilderComponent,
    TxSignerComponent,
    TxSubmitComponent,
    AddressBarComponent,
    AmountBarComponent,
  ],
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    WalletRoutingModule
  ]
})
export class WalletModule { }
