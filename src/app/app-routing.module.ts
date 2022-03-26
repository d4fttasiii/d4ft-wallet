import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./wallet/wallet.module').then((m) => m.WalletModule),
  },
  {
    path: 'config',
    loadChildren: () => import('./config/config.module').then((m) => m.ConfigModule),
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
