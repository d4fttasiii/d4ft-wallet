import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MenuItem } from '../../../core/models/menu-item';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  @Input() items: MenuItem[];
  @Output() navigated = new EventEmitter();

  constructor() { }

  emitNavigated() {
    this.navigated.emit();
  }
}
