import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { BinanceService } from './binance.service';
import { IBlockchainClient } from './blockchain-client';
import { EthereumService } from './ethereum.service';
import { PolygonService } from './polygon.service';
import { StellarService } from './stellar.service';

@Injectable({
  providedIn: 'root'
})
export class ClientFactoryService {

  constructor(
    private stellar: StellarService,
    private ethereum: EthereumService,
    private binance: BinanceService,
    private polygon: PolygonService) { }

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
    }
  }
}
