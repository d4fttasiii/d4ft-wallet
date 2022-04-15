import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { BitcoinService } from './bitcoin.service';

@Injectable({
  providedIn: 'root'
})
export class LitecoinService extends BitcoinService {

  constructor(protected configService: ConfigService, protected httpClient: HttpClient) {
    super(configService, httpClient);
  }
}
