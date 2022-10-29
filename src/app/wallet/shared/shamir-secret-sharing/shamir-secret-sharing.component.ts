import { ConnectedOverlayPositionChange } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { Uint32 } from '@cosmjs/math';
import { makeKeyRegistrationTxn } from 'algosdk';
import BigNumber from 'bignumber.js';
import { number } from 'bitcoinjs-lib/src/script';
import { multiply, values } from 'lodash';
import { hexToNumber, hexToNumberString, stringToHex } from 'web3-utils';

import { Blockchains } from '../../../core/models/blockchains';
import { Keypair } from '../../../core/models/keypair';
import { ClientFactoryService, NotificationService } from '../../../core/services';
import { IBlockchainClient } from '../../../core/services/blockchain/blockchain-client';
// import { combine } from 'secrets.js-grempe';

class GcdResult {
  greatestCommonDivisor: BigNumber;
  bezoutCoefficients: BigNumber[];
  quotients: BigNumber[];
}

class FinitePoint {
  x: BigNumber;
  y: BigNumber;

  constructor(shard: string) {
    const s = shard.split('-');
    this.x = this.hexToBigNumber(s[0]);
    this.y = this.hexToBigNumber(s[1]);
  }


  hexToBigNumber(hex: string) {
    hex = hex.toUpperCase();
    const hexValues = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F];
    const one = new BigNumber(1);
    const n256 = new BigNumber(256);
    let result = new BigNumber(0);;
    let base = one;

    for (let x = 0, i = 0; i < hex.length; i += 2, x += 1) {
      const ZeroDigit = '0'.charCodeAt(0);
      let byte = (hexValues[hex.charCodeAt(i + 0) - ZeroDigit] << 4) | (hexValues[hex.charCodeAt(i + 1) - ZeroDigit]);
      result = result.plus(base.multipliedBy(new BigNumber(byte.toString(16), 16)));
      base = base.multipliedBy(n256);
    }
    // another method to read byte array as bigint: (but this implementation works only with 1,2,4,8 byte length)
    // https://gist.github.com/Fantasim/c92060cbf8494be52f23887caf7f81fe
    return result;
  }

  distanceFromOrigin(): BigNumber {
    return (this.x.multipliedBy(this.x).plus(this.y.multipliedBy(this.y))).sqrt();
  }
}

@Component({
  selector: 'app-shamir-secret-sharing',
  templateUrl: './shamir-secret-sharing.component.html',
  styleUrls: ['./shamir-secret-sharing.component.scss'],
})
export class ShamirSecretSharingComponent {
  client: IBlockchainClient;
  result: string;
  key1: string;
  key2: string;

  keypair: Keypair;
  keypairString: string;
  Blockchains = Blockchains;
  securityLevels = [5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423, 9689, 9941, 11213, 21701, 23209, 44497, 86243, 110503];
  secret: string;
  constructor(private clientFactory: ClientFactoryService, protected notification: NotificationService) { }

  reconstruct(shards: string[]): string {
    let points: FinitePoint[] = [];
    shards.forEach((x) => {
      x = x.replace(/ /g, "",);
      points.push(new FinitePoint(x));
    });


    let max = this.max(points);
    let bitcount = new BigNumber(max.y.toString(16).length).dividedBy(2).multipliedBy(8);
    let securityLevel = this.calculateSecurityLevel(bitcount.toNumber());
    let index = this.securityLevels.indexOf(securityLevel);
    let mersennePrime = this.calculateMersennePrime(securityLevel);

    while ((max.y.mod(mersennePrime).plus(mersennePrime)).mod(mersennePrime).isEqualTo(max.y) && index > 0 && securityLevel > 5) {
      securityLevel = this.calculateSecurityLevel(this.securityLevels[--index]);
      mersennePrime = this.calculateMersennePrime(securityLevel);
    }

    securityLevel = this.calculateSecurityLevel(this.securityLevels[securityLevel > 5 ? ++index : index]);
    mersennePrime = this.calculateMersennePrime(securityLevel);
    let secretNbr = this.lagrangeInterpolate(points, mersennePrime);
    if (secretNbr.toString() === '0') {
      this.notification.error("Couldn't reconstruct the original secret");
    }
    this.secret = this.toText(secretNbr);
    return this.secret;
  }

  calculateSecurityLevel(value: number) {
    if (value < 5) {
      this.notification.error("Minimum exceeded!");
      throw new Error("Minimum exceeded!");
    }

    var index = this.securityLevels.indexOf(value);
    if (index < 0) { //not found
      try {
        for (let i = 0; i < this.securityLevels.length; i++) {
          if (this.securityLevels[i] > value) {
            return this.securityLevels[i];
          }
        }
        return this.securityLevels.at(this.securityLevels.length - 1);
      }
      catch (e: any) {
        throw new Error("Maximum exceeded!");
      }
    }
    return value;
  }

  toText(bignumber: BigNumber): string {
    let hex = bignumber.toString(16);
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
      var v = parseInt(hex.substr(i, 2), 16);
      if (v) str = String.fromCharCode(v) + str;
    }
    return str;
  }

  lagrangeInterpolate(finitePoints: FinitePoint[], prime: BigNumber): BigNumber {
    let distinct =
      finitePoints.filter((point, i, arr) =>
        arr.findIndex(p => p.x.toString() === point.x.toString() && p.y.toString() === point.y.toString()) === i);
    if (distinct.length != finitePoints.length) {
      this.notification.error("The provided shards are the same");
      throw new Error("The provided points must be different!");
    }

    let k = finitePoints.length;
    let numerators: BigNumber[] = [];
    let denominators: BigNumber[] = [];
    for (var i = 0; i < k; i++) {
      var others = [...finitePoints];
      var current = others[i];
      others.splice(i, 1); //removeAt
      const numTask = this.product(others.map(o => new BigNumber(0).minus(o.x)));
      const denTask = this.product(others.map(o => current.x.minus(o.x)));
      numerators.push(numTask);
      denominators.push(denTask);
    }

    var numerator = new BigNumber(0);
    var denominator = this.product(denominators);

    for (let i = 0; i < k; i++) {
      let result = this.divMod(numerators[i].multipliedBy(denominator).multipliedBy(((finitePoints[i].y.mod(prime).plus(prime)).mod(prime))), denominators[i], prime);
      numerator = numerator.plus(result);
    }

    var a = this.divMod(numerator, denominator, prime).plus(prime);
    return (a.mod(prime).plus(prime)).mod(prime); //// mathematical modulo
  }

  product(values: BigNumber[]) {
    var accum = new BigNumber(1);
    values.forEach(element => {
      accum = accum.multipliedBy(element);
    });
    return accum;
  }

  divMod(numerator: BigNumber, denominator: BigNumber, prime: BigNumber) {
    let result = this.compute(denominator, prime);
    return numerator.multipliedBy(result.bezoutCoefficients[0]).multipliedBy(result.greatestCommonDivisor);
  }

  compute(a: BigNumber, b: BigNumber): GcdResult {
    let x = new BigNumber(0);
    let last_x = new BigNumber(1);
    let y = new BigNumber(1);
    let last_y = new BigNumber(0);
    let r = b;
    let last_r = a;
    while (!r.eq(new BigNumber(0))) {
      let quotient = last_r.dividedToIntegerBy(r);

      let tmpR = r;
      r = last_r.minus(quotient.multipliedBy(r));
      last_r = tmpR;

      let tmpX = x;
      x = last_x.minus(quotient.multipliedBy(x));
      last_x = tmpX;

      let tmpY = y;
      y = last_y.minus(quotient.multipliedBy(y));
      last_y = tmpY;
    }
    let coeff = [last_x, last_y];
    let quot = [x, y];
    return {
      greatestCommonDivisor: last_r,
      bezoutCoefficients: coeff,
      quotients: quot
    };
  }

  max(testArray: FinitePoint[]) {
    let max = testArray[0];
    for (let i = 1; i < testArray.length; ++i) {
      let p = testArray[i];
      if (p.distanceFromOrigin() > max.distanceFromOrigin()) {
        max = testArray[i];
      }
    }
    return max;
  }

  calculateMersennePrime(exp: number) {
    var two = new BigNumber(2);
    return two.pow(exp).minus(new BigNumber(1));
  }

  setSelectedBlockchain(blockchain: Blockchains) {
    this.client = this.clientFactory.getClient(blockchain);
  }




}

