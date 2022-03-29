import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MenuItem } from '../../../core/models/menu-item';
import { Mode } from '../../../core/models/mode';
import { ConfigService } from '../../../core/services';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  @Input() items: MenuItem[];
  @Output() navigated = new EventEmitter();

  constructor(private configService: ConfigService) { }

  emitNavigated() {
    this.navigated.emit();
  }

  isOffline(): boolean {
    const mode = this.configService.getMode();
    return mode === Mode.Offline;
  }

  toggleMode() {
    const mode = this.configService.getMode();
    switch (mode) {
      case Mode.Offline:
        this.configService.setOnlineMode();
        break;
      case Mode.Online:
      default:
        this.configService.setOfflineMode();
        break;
    }
  }
}
