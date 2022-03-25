import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TxBuilderComponent } from './tx-builder/tx-builder.component';
import { TxSignerComponent } from './tx-signer/tx-signer.component';
import { TxSubmitComponent } from './tx-submit/tx-submit.component';
import { WalletComponent } from './wallet/wallet.component';

const routes: Routes = [
  {
    path: '',
    component: WalletComponent,
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
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletRoutingModule { }
