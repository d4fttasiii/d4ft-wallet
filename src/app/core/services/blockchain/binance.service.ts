import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { EthereumService } from './ethereum.service';

@Injectable({
  providedIn: 'root'
})
export class BinanceService extends EthereumService {

  nativeSymbol: string = "BNB";
  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(config, notification);
  }

  protected override getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Binance) as EthereumConfig;
  }
}
