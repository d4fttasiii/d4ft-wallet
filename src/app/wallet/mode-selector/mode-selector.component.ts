import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Mode } from '../../core/models/mode';
import { ConfigService } from '../../core/services';

@Component({
  selector: 'app-mode-selector',
  templateUrl: './mode-selector.component.html',
  styleUrls: ['./mode-selector.component.scss']
})
export class ModeSelectorComponent {

  constructor(private router: Router, private configService: ConfigService) { }

  selectOffline() {
    this.configService.setOfflineMode();
    this.router.navigate(['tx-signer']);
  }

  selectOnline() {
    this.configService.setOnlineMode();
    this.router.navigate(['tx-builder']);
  }

}
