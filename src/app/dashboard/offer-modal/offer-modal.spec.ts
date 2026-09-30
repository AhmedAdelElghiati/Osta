import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfferModal } from './offer-modal';

describe('OfferModal', () => {
  let component: OfferModal;
  let fixture: ComponentFixture<OfferModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferModal],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
