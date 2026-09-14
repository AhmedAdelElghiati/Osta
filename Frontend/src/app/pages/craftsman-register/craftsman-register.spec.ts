import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CraftsmanRegister } from './craftsman-register';

describe('CraftsmanRegister', () => {
  let component: CraftsmanRegister;
  let fixture: ComponentFixture<CraftsmanRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CraftsmanRegister],
    }).compileComponents();

    fixture = TestBed.createComponent(CraftsmanRegister);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
