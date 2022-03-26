import { Injectable } from '@angular/core';
import { EthereumConfig } from '../../models/ethereum-config';

import { ElectronService } from '../electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {



  constructor(private electron: ElectronService) { }

  getEthereumConfig(): EthereumConfig {
    return {
      chainId: 1337,
      url: 'HTTP://127.0.0.1:7545',
    };
  }
}
