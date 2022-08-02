import { Injectable } from '@angular/core';
import Keyring, { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { assert, hexToU8a, isHex, u8aToHex } from '@polkadot/util';

import { Blockchains } from '../../models/blockchains';
import { PolkadotConfig } from '../../models/config';
import { Keypair } from '../../models/keypair';
import { Transaction } from '../../models/transaction';
import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BaseBlockchainClient, IBlockchainClient } from './blockchain-client';
import BigNumber from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { blake2AsHex, cryptoWaitReady } from '@polkadot/util-crypto';
import { PolkadotService, PolkadotSignDto } from './polkadot.service';
type Curves = 'ed25519' | 'sr25519' | 'ecdsa';



@Injectable({
  providedIn: 'root',
})
export class KusamaService extends PolkadotService {
  nativeSymbol: string = "KSM";
  decimals: number = 12;
  derivationkeypath: string = 'sr25519'; //this chain not using the derivation keypath to generate keypair.
  ss58Format = 2;
  type: Curves = 'sr25519';
  defaultFee = 50000000;


  constructor(protected config: ConfigService, protected notification: NotificationService) {
    super(config, notification);
  }

  override getConfig(): PolkadotConfig {
    return this.config.get(Blockchains.Kusama) as PolkadotConfig;
  }


}
