import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { AvalancheService } from './avalanche.service';
import { BinanceService } from './binance.service';
import { IBlockchainClient } from './blockchain-client';
import { EthereumService } from './ethereum.service';
import { HarmonyService } from './harmony.service';
import { PolygonService } from './polygon.service';
import { StellarService } from './stellar.service';
import { TerraService } from './terra.service';

@Injectable({
  providedIn: 'root'
})
export class ClientFactoryService {

  constructor(
    private stellar: StellarService,
    private ethereum: EthereumService,
    private binance: BinanceService,
    private polygon: PolygonService,
    private avalanche: AvalancheService,
    private harmony: HarmonyService,
    private terra: TerraService) { }

  getClient(blockchain: Blockchains): IBlockchainClient {
    switch (blockchain) {
      case Blockchains.Stellar:
        return this.stellar;

      case Blockchains.Ethereum:
        return this.ethereum;

      case Blockchains.Polygon:
        return this.polygon;

      case Blockchains.Binance:
        return this.binance;

      case Blockchains.Avalanche:
        return this.avalanche;

      case Blockchains.Harmony:
        return this.harmony;

      case Blockchains.Terra:
        return this.terra;
    }
  }
}
