import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { AlgorandService } from './algorand.service';
import { AvalancheService } from './avalanche.service';
import { BinanceService } from './binance.service';
import { BitcoinService } from './bitcoin.service';
import { IBlockchainClient } from './blockchain-client';
import { CosmosService } from './cosmos.service';
import { EthereumService } from './ethereum.service';
import { HarmonyService } from './harmony.service';
import { LitecoinService } from './litecoin.service';
import { PolkadotService } from './polkadot.service';
import { PolygonService } from './polygon.service';
import { SolanaService } from './solana.service';
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
    private terra: TerraService,
    private solana: SolanaService,
    private bitcoin: BitcoinService,
    private litecoin: LitecoinService,
    private algorand: AlgorandService,
    private polkadot: PolkadotService,
    private cosmos: CosmosService) { }

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

      case Blockchains.Solana:
        return this.solana;

      case Blockchains.Terra:
        return this.terra;

      case Blockchains.Bitcoin:
        return this.bitcoin;

      case Blockchains.Litecoin:
        return this.litecoin;

      case Blockchains.Algorand:
        return this.algorand;

      case Blockchains.Polkadot:
        return this.polkadot;

      case Blockchains.Cosmos:
        return this.cosmos;
    }
  }
}
