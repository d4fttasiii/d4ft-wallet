import { Component, OnInit } from '@angular/core';

import { Config } from '../../core/models/config';
import { ConfigService } from '../../core/services';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {

  solClusters = ['devnet', 'testnet', 'mainnet-beta'];
  originalConfig: Config;
  config: Config;
  isLoading = false;

  constructor(private configService: ConfigService) { }

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig() {
    this.config = this.configService.getAll();
    this.originalConfig = this.configService.getAll();
  }

  save() {
    this.configService.update(this.config);
  }
}
