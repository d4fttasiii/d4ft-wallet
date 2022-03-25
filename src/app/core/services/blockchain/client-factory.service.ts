import { Injectable } from '@angular/core';

import { Blockchains } from '../../models/blockchains';
import { IBlockchainClient } from './blockchain-client';
import { StellarService } from './stellar.service';

@Injectable({
  providedIn: 'root'
})
export class ClientFactoryService {

  constructor(private stellar: StellarService) { }

  getClient(blockchain: Blockchains): IBlockchainClient {
    switch (blockchain) {
      case Blockchains.Stellar:
        return this.stellar;
    }
  }
}
