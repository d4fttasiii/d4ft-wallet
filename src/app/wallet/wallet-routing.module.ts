import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModeSelectorComponent } from './mode-selector/mode-selector.component';
import { TxBuilderComponent } from './tx-builder/tx-builder.component';
import { TxSignerComponent } from './tx-signer/tx-signer.component';
import { TxSubmitComponent } from './tx-submit/tx-submit.component';
import { WalletComponent } from './wallet/wallet.component';

const routes: Routes = [
  {
    path: '',
    component: ModeSelectorComponent,
  },
  {
    path: 'tx-builder',
    component: TxBuilderComponent,
  },
  {
    path: 'tx-signer',
    component: TxSignerComponent,
  },
  {
    path: 'tx-submit',
    component: TxSubmitComponent,
  },
  {
    path: 'wallet',
    component: WalletComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
