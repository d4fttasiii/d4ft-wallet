import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
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
    CommonModule,
    HttpClientModule,
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: initializeCore,
    deps: [SVGLibraryService], multi: true
  }]
})
export class CoreModule { }
