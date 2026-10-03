import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { Marketplace, OfferVm } from '../../../../services/marketplace';

@Component({
  selector: 'app-dashboard-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-offers.html',
  styleUrl: './dashboard-offers.css',
})
export class DashboardOffers implements OnInit {
  @Output() pageChange = new EventEmitter<string>();
  @Output() newRequest = new EventEmitter<void>();
  @Output() requestDetails = new EventEmitter<string>();
  @Output() offerAccepted = new EventEmitter<string>();

  private readonly api = inject(Marketplace);
  private readonly cdr = inject(ChangeDetectorRef);

  offers: OfferVm[] = [];
  loading = false;
  error = '';
  actionId = '';
  notice = '';

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.loading = true;
    this.error = '';
    this.api.myOffers().subscribe({
      next: (response) => {
        const data = response?.data;
        this.offers = Array.isArray(data) ? data : data?.items ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'تعذر تحميل العروض.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  accept(offer: OfferVm): void {
    this.actionId = offer._id;
    this.error = '';
    this.api.acceptOffer(offer._id).subscribe({
      next: () => {
        this.notice = 'تم قبول العرض بنجاح.';
        this.offerAccepted.emit(this.requestId(offer));
        this.loadOffers();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر قبول العرض.'),
      complete: () => (this.actionId = ''),
    });
  }

  reject(offer: OfferVm): void {
    this.actionId = offer._id;
    this.error = '';
    this.api.rejectOffer(offer._id).subscribe({
      next: () => {
        this.notice = 'تم رفض العرض.';
        this.loadOffers();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر رفض العرض.'),
      complete: () => (this.actionId = ''),
    });
  }

  openRequest(offer: OfferVm): void {
    const id = this.requestId(offer);
    if (id) this.requestDetails.emit(id);
  }

  goToPage(page: string): void {
    this.pageChange.emit(page);
  }

  private requestId(offer: OfferVm): string {
    return typeof offer.requestId === 'object' ? String(offer.requestId?._id || '') : String(offer.requestId || '');
  }
}
