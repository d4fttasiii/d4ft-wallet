import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';
import { ConfigRoutingModule } from './config-routing.module';
import { ConfigComponent } from './config/config.component';


@NgModule({
  declarations: [
    ConfigComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    ConfigRoutingModule
  ]
})
export class ConfigModule { }
