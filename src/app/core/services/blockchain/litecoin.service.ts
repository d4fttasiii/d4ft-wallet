import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Network, address as Address, Psbt } from 'bitcoinjs-lib';
import { Blockchains } from '../../models/blockchains';
import { BitcoinConfig } from '../../models/config';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
const bip32 = BIP32Factory(ecc);
import * as bitcoin from 'bitcoinjs-lib';

import { ConfigService } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';
import { BitcoinService } from './bitcoin.service';
import { Keypair } from '../../models/keypair';

const litecoin = {
  network: {
    main: {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: "ltc",
      bip32: {
        public: 0x019da462,
        private: 0x019d9cfe
      },
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0
    },
    test: {
      messagePrefix: '\x18Litecoin Signed Message:\n',
      bech32: "tltc",
      bip32: {
        public: 0x0436ef7d,
        private: 0x0436f6e1
      },
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class LitecoinService extends BitcoinService {
  nativeSymbol: string = "LTC";
  derivationkeypath: string = "m/84'/2'/0'/0/0";

  constructor(
    protected configService: ConfigService,
    protected httpClient: HttpClient,
    protected notification: NotificationService
  ) {
    super(configService, httpClient, notification);
  }

  override async generatePrivateKeyFromMnemonic(mnemonic: string, keypath: string): Promise<Keypair> {
    return await this.tryExecuteAsync(async () => {
      if (bip39.validateMnemonic(mnemonic)) {
        ECPairFactory
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const root = bip32.fromSeed(seed);
        const keyPair = root.derivePath(keypath ? keypath : this.derivationkeypath);
        const strng = keyPair.toBase58()
        const restored = bip32.fromBase58(strng);
        const network = this.getNetwork();
        const address = bitcoin.payments.p2wpkh({ pubkey: restored.publicKey, network: network }).address;
        const address2 = bitcoin.payments.p2pkh({ pubkey: restored.publicKey, network: network }).address;
        const privKey = keyPair.toWIF();
        return {
          privateKey: privKey,
          publicAddress: address,
          alternativeAddress: address2
        };
      } else { throw new Error('Invalid mnemonic keypharse'); }
    });
  }

  override async isAddressValid(address: string): Promise<boolean> {
    try {
      const cfg = this.getConfig();
      Address.toOutputScript(address, litecoin.network.main);
      return await Promise.resolve(true);
    } catch {
      return await Promise.resolve(false);;
    }
  }

  override async signRawTx(rawTx: string, pk: string): Promise<string> {
    return this.tryExecute(() => {
      const ECPair = ECPairFactory(ecc);
      const key = ECPair.fromWIF(pk, this.getNetwork());
      const pbst = Psbt.fromHex(rawTx);
      pbst.signAllInputs(key);
      pbst.finalizeAllInputs();

      return pbst.extractTransaction().toHex();
    });
  }

  protected override getConfig(): BitcoinConfig {
    return this.configService.get(Blockchains.Litecoin) as BitcoinConfig;
  }

  protected override getNetwork(isMainnet?: boolean) {
    return this.getConfig().isMainnet ? litecoin.network.main : litecoin.network.test
  }
}
