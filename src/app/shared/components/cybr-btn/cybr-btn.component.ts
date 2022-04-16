import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-cybr-btn',
  templateUrl: './cybr-btn.component.html',
  styleUrls: ['./cybr-btn.component.scss']
})
export class CybrBtnComponent {

  @Input() label: string;
  @Input() isDisabled: boolean;
  @Input() color: 'primary' | 'accent' | 'warn';
  @Input() faIcon: string;
  @Input() btnStyle: string;
  @Input() fullWidth: boolean;
  @Output() clicked = new EventEmitter();

  constructor() { }

  click(){
    this.clicked.emit();
  }
}
