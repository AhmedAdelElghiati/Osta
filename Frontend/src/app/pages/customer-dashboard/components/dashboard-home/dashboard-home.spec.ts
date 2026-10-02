import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardHome } from './dashboard-home';

describe('DashboardHome', () => {
  let component: DashboardHome;
  let fixture: ComponentFixture<DashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHome],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the highest price among offers that need review', () => {
    component.kitchenOffers = [{ price: 2563 }, { price: 5600 }];

    expect(component.maxOfferPrice).toBe(5600);
  });
});
