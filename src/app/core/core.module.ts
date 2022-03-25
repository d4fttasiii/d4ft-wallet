import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';

import { SVGLibraryService } from './services';

function initializeCore(svgLibService: SVGLibraryService) {
  return (): Promise<any> => {
    return new Promise<void>((resolve, reject) => {
      svgLibService.init();
      resolve();
    });
  };
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: initializeCore,
    deps: [SVGLibraryService], multi: true
  }]
})
export class CoreModule { }
