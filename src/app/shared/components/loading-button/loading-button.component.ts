import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-loading-button',
  templateUrl: './loading-button.component.html',
  styleUrls: ['./loading-button.component.scss']
})
export class LoadingButtonComponent {

  @Input() label: string;
  @Input() isDisabled: boolean;
  @Input() isLoading: boolean;
  @Output() clicked = new EventEmitter();

  constructor() { }

  click() {
    this.clicked.emit();
  }

}
