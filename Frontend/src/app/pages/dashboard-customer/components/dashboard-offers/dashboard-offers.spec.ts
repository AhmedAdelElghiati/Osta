import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardOffers } from './dashboard-offers';

describe('DashboardOffers', () => {
  let component: DashboardOffers;
  let fixture: ComponentFixture<DashboardOffers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardOffers],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardOffers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
