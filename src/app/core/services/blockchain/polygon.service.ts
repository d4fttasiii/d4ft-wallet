import { Injectable } from '@angular/core';
import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';

import { ConfigService } from '../config/config.service';
import { EthereumService } from './ethereum.service';

@Injectable({
  providedIn: 'root'
})
export class PolygonService extends EthereumService {

  constructor(protected config: ConfigService) {
    super(config);
  }

  protected override getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Polygon) as EthereumConfig;
  }
}
