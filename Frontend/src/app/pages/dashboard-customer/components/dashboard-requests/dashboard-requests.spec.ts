import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardRequests } from './dashboard-requests';

describe('DashboardRequests', () => {
  let component: DashboardRequests;
  let fixture: ComponentFixture<DashboardRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRequests],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
