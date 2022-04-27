import { Injectable } from '@angular/core';
import { fromBech32, HarmonyAddress } from '@harmony-js/crypto';

import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { EthereumService } from './ethereum.service';

@Injectable({
  providedIn: 'root'
})
export class HarmonyService extends EthereumService {

  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(config, notification);
  }
  
  protected override addressToPublicKey(address: string): string {
    const pubk = fromBech32(address);
    return pubk;
  }

  protected override validateAddress(address: string): boolean {
    const isValid = HarmonyAddress.isValidBech32(address);
    return isValid;
  }

  protected override getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Harmony) as EthereumConfig;
  }

}
