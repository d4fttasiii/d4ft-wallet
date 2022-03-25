import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

import { MenuItem } from '../../../core/models/menu-item';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss']
})
export class MenuItemComponent {
  @Input() item: MenuItem;
  @Output() navigated = new EventEmitter();

  constructor(private router: Router) { }

  navigateTo(route: string) {
    this.navigated.emit();
    this.router.navigate(['/', route]);
  }
}
