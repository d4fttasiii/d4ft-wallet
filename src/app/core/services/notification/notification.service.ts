import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  success(message: string, action?: string) {
    this.snackBar.open(message, action || 'OK', {
      horizontalPosition: 'right',
      verticalPosition: 'bottom',

    });
  }

  error(message: string, action?: string) {
    this.snackBar.open(message, action || 'OK', {
      horizontalPosition: 'right',
      verticalPosition: 'bottom',

    });
  }

}
