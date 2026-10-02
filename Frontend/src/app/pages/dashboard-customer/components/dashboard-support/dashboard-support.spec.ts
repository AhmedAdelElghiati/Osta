import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardSupport } from './dashboard-support';

describe('DashboardSupport', () => {
  let component: DashboardSupport;
  let fixture: ComponentFixture<DashboardSupport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSupport],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardSupport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
