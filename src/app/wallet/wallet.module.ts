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
import { BlockchainSelectorComponent } from './shared/blockchain-selector/blockchain-selector.component';
import { ModeSelectorComponent } from './mode-selector/mode-selector.component';
import { EthTxFormComponent } from './shared/eth-tx-form/eth-tx-form.component';
import { TerraTxFormComponent } from './shared/terra-tx-form/terra-tx-form.component';
import { DefaultTxFormComponent } from './shared/default-tx-form/default-tx-form.component';
import { BtcTxFormComponent } from './shared/btc-tx-form/btc-tx-form.component';
import { UtxoSelectorComponent } from './shared/utxo-selector/utxo-selector.component';
import { MnemonicToPrivateKeyComponent } from './shared/mnemonic-priv-gen/mnemonic-priv-gen.component';
import { CosmosTxFormComponent } from './shared/cosmos-tx-form/cosmos-tx-form.component';
import { BigNumberAmountBarComponent } from './shared/bignumber-amount-bar/bignumber-amount-bar.component';


@NgModule({
  declarations: [
    WalletComponent,
    TxBuilderComponent,
    TxSignerComponent,
    TxSubmitComponent,
    AddressBarComponent,
    AmountBarComponent,
    BlockchainSelectorComponent,
    ModeSelectorComponent,
    EthTxFormComponent,
    TerraTxFormComponent,
    DefaultTxFormComponent,
    BtcTxFormComponent,
    UtxoSelectorComponent,
    MnemonicToPrivateKeyComponent,
    CosmosTxFormComponent,
    BigNumberAmountBarComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    WalletRoutingModule
  ]
})
export class WalletModule { }
