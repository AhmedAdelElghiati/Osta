import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardWallet } from './dashboard-wallet';

describe('DashboardWallet', () => {
  let component: DashboardWallet;
  let fixture: ComponentFixture<DashboardWallet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardWallet],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardWallet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
