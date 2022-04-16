import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { TranslateService } from '@ngx-translate/core';

import { APP_CONFIG } from '../environments/environment';
import { MenuItem } from './core/models/menu-item';
import { Mode } from './core/models/mode';
import { ConfigService, ElectronService } from './core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnInit {
  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;
  menuItems: MenuItem[];
  isSideNaveOpen = false;

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private configService: ConfigService,
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }

  ngOnInit(): void {
    this.menuItems = [
      // {
      //   icon: 'fa-wallet',
      //   label: 'Wallet',
      //   route: 'wallet',
      //   isDisabled: () => true,
      // },
      {
        icon: 'fa-trowel-bricks',
        label: 'Tx Builder',
        route: 'tx-builder',
        isDisabled: () => {
          const m = this.configService.getMode();
          return m && m === Mode.Offline;
        },
      },
      {
        icon: 'fa-pen-to-square',
        label: 'Tx Signer',
        route: 'tx-signer',
        isDisabled: () => false,
      },
      {
        icon: 'fa-paper-plane',
        label: 'Tx Submit',
        route: 'tx-submit',
        isDisabled: () => {
          const m = this.configService.getMode();
          return m && m === Mode.Offline;
        },
      },
      {
        icon: 'fa-cog',
        label: 'Config',
        route: 'config',
        isDisabled: () => false,
        showDividerBelow: true,
      }
    ];
  }

  ngAfterViewInit(): void {
    this.sidenav.close();
  }

  sideNavOpened(open: boolean) {
    this.isSideNaveOpen = open;
  }
}
