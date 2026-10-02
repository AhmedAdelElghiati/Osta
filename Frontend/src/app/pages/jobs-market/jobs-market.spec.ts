import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobsMarket } from './jobs-market';

describe('JobsMarket', () => {
  let component: JobsMarket;
  let fixture: ComponentFixture<JobsMarket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobsMarket],
    }).compileComponents();

    fixture = TestBed.createComponent(JobsMarket);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
