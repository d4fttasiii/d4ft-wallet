import { Injectable } from '@angular/core';

import { Config, EthereumConfig } from '../../models/config';
import { ElectronService } from '../electron/electron.service';

const KEY = "D4FT_CFG";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor(private electron: ElectronService) { }

  getEthereumConfig(): EthereumConfig {
    return this.get().ethereum;
  }

  get(): Config {
    const localCfg = this.getFromLocalStorage();
    if (localCfg) {
      return localCfg;
    }
    const fileCfg = this.getFromFile();
    const cfg = fileCfg || this.getDefault();
    this.updateLocalStorage(cfg);

    if (!fileCfg) {
      this.updateFile(cfg);
    }

    return cfg;
  }

  update(cfg: Config) {
    this.updateLocalStorage(cfg);
    this.updateFile(cfg);
  }

  private updateLocalStorage(cfg: Config) {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  }

  private updateFile(cfg: Config) {
    if (this.electron.isElectron) {
      this.electron.fs.writeFileSync('config.cfg', JSON.stringify(cfg));
    }
  }

  private getFromLocalStorage(): Config {
    const cfgJson = localStorage.getItem(KEY);
    if (cfgJson) {
      const cfg = JSON.parse(cfgJson) as Config;
      return cfg;
    }
    return null;
  }

  private getFromFile(): Config {
    const path = 'config.cfg';
    try {
      const bfr = this.electron.fs.readFileSync(path);
      const cfgJson = bfr.toString();
      if (cfgJson) {
        const cfg = JSON.parse(cfgJson) as Config;
        return cfg;
      }
      return null;
    }
    catch {
      return null;
    }
  }

  private getDefault(): Config {
    return {
      ethereum: {
        chainId: 1337,
        url: 'HTTP://127.0.0.1:7545',
      },
      stellar: {
        url: 'https://horizon-testnet.stellar.org/',
        networkPhrase: 'Test SDF Network ; September 2015'
      }
    };
  }
}
