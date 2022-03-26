import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { IBlockchainClient } from './blockchain-client';
import { EthereumService } from './ethereum.service';
import { StellarService } from './stellar.service';

@Injectable({
  providedIn: 'root'
})
export class ClientFactoryService {

  constructor(private stellar: StellarService, private ethereum: EthereumService) { }

  getClient(blockchain: Blockchains): IBlockchainClient {
    switch (blockchain) {
      case Blockchains.Stellar:
        return this.stellar;
      case Blockchains.Ethereum:
        return this.ethereum;
    }
  }
}
