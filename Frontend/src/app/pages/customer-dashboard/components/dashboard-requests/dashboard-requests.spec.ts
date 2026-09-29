import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRequests } from './dashboard-requests';

describe('DashboardRequests', () => {
  let component: DashboardRequests;
  let fixture: ComponentFixture<DashboardRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
