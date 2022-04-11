import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerraTxFormComponent } from './terra-tx-form.component';

describe('TerraTxFormComponent', () => {
  let component: TerraTxFormComponent;
  let fixture: ComponentFixture<TerraTxFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TerraTxFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerraTxFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
