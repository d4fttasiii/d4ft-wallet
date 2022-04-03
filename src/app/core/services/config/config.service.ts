import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { Config } from '../../models/config';
import { Mode } from '../../models/mode';
import { ElectronService } from '../electron/electron.service';

const KEY = "D4FT_CFG";
const MODE = "D4FT_MODE";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor(private electron: ElectronService) { }

  getMode(): Mode {
    const modeJson = localStorage.getItem(MODE);
    if (modeJson) {
      const mode = JSON.parse(modeJson);
      return mode.mode as Mode;
    }
    return null;
  }

  setOfflineMode() {
    localStorage.setItem(MODE, JSON.stringify({ mode: Mode.Offline }));
  }

  setOnlineMode() {
    localStorage.setItem(MODE, JSON.stringify({ mode: Mode.Online }));
  }

  get(blockchain: Blockchains) {
    const cfg = this.getAll();
    switch (blockchain) {
      case Blockchains.Stellar:
        return cfg.stellar;
      case Blockchains.Ethereum:
        return cfg.ethereum;
      case Blockchains.Polygon:
        return cfg.polygon;
      case Blockchains.Binance:
        return cfg.binance;        
      case Blockchains.Avalanche:
        return cfg.avalanche;        
      case Blockchains.Harmony:
        return cfg.harmony;
      case Blockchains.Solana: 
        return cfg.solana;
    }
  }

  getAll(): Config {
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
      },
      polygon: {
        chainId: 1337,
        url: 'HTTP://127.0.0.1:7545',
      },
      binance: {
        chainId: 1337,
        url: 'HTTP://127.0.0.1:7545',
      },
      avalanche: {
        chainId: 1337,
        url: 'HTTP://127.0.0.1:7545',
      },
      harmony: {
        chainId: 1337,
        url: 'HTTP://127.0.0.1:7545',
      },
      solana: {
        cluster: 'devnet',
      }
    };
  }
}
