import { Injectable } from '@angular/core';
import { Blockchains } from '../../models/blockchains';
import { EthereumConfig } from '../../models/config';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { EthereumService } from './ethereum.service';

@Injectable({
  providedIn: 'root'
})
export class AvalancheService extends EthereumService {

  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(config, notification);
  }

  derivationkeypath = "m/44'/60'/0'/0/0";

  override async signRawTx(rawTx: string, pk: string): Promise<string> {
    // return await super.signRawTx(rawTx, privatekey);
    return await  this.tryExecuteAsync(async () => {
      const web3 = this.getClient();
      const txObject = JSON.parse(rawTx);      
      const signedTx = await web3.eth.accounts.signTransaction(txObject, pk);
      return signedTx.rawTransaction;
    });
  }

  protected override getConfig(): EthereumConfig {
    return this.config.get(Blockchains.Avalanche) as EthereumConfig;
  }
}
