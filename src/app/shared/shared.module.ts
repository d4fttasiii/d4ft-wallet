import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { CybrBtnComponent } from './components/cybr-btn/cybr-btn.component';
import { LoadingButtonComponent } from './components/loading-button/loading-button.component';
import { MenuItemComponent } from './components/menu-item/menu-item.component';
import { MenuComponent } from './components/menu/menu.component';
import { CopyClipboardDirective, WebviewDirective } from './directives/';

const MAT_MODULES = [
  MatIconModule,
  MatToolbarModule,
  MatSidenavModule,
  MatButtonModule,
  MatIconModule,
  MatDividerModule,
  MatCardModule,
  MatListModule,
  MatTooltipModule,
  MatInputModule,
  MatNativeDateModule,
  MatExpansionModule,
  MatSelectModule,
  MatSnackBarModule,
  MatGridListModule,
  MatCheckboxModule,
  MatSlideToggleModule,
  MatAutocompleteModule,
  MatRadioModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule
];

@NgModule({
  declarations: [
    WebviewDirective,
    CopyClipboardDirective,
    MenuComponent,
    MenuItemComponent,
    LoadingButtonComponent,
    CybrBtnComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    ...MAT_MODULES],
  exports: [
    TranslateModule,
    WebviewDirective,
    CopyClipboardDirective,
    ReactiveFormsModule,
    FormsModule,
    ...MAT_MODULES,
    MenuComponent,
    LoadingButtonComponent,
    CybrBtnComponent,
  ],
})
export class SharedModule { }
