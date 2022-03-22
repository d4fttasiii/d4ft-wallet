import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ClipboardService {
    copy(payload: string) {
        const listener = (e: ClipboardEvent) => {
            const clipboard = e.clipboardData || window['clipboardData'];
            clipboard.setData('text', payload);
            e.preventDefault();
        };
        document.addEventListener('copy', listener, false);
        document.execCommand('copy');
        document.removeEventListener('copy', listener, false);
    }
}
