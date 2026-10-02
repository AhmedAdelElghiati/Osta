import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SentOffers } from './sent-offers';

describe('SentOffers', () => {
  let component: SentOffers;
  let fixture: ComponentFixture<SentOffers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentOffers],
    }).compileComponents();

    fixture = TestBed.createComponent(SentOffers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
