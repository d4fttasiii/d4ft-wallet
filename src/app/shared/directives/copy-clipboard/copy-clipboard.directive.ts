import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClipboardService } from '../../../core/services/clipboard/clipboard.service';

@Directive({
  selector: '[appCopyClipboard]',
})
export class CopyClipboardDirective {
  @Input('appCopyClipboard') payload: string;
  @Output() copied: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private clipboard: ClipboardService,
    private snackBar: MatSnackBar
  ) {}

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    event.preventDefault();
    if (!this.payload) {
      return;
    }
    this.clipboard.copy(this.payload.toString());
    this.copied.emit(this.payload);
    this.snackBar.open('Copied!', '', {
      duration: 1500,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      politeness: 'polite',
    });
  }
}
