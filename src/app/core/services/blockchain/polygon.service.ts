import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { EthereumService } from './ethereum.service';

@Injectable({
  providedIn: 'root'
})
export class PolygonService extends EthereumService {
  nativeSymbol: string = "POLY";

  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(config, notification);
  }

  protected override getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Polygon) as EthereumConfig;
  }
}
