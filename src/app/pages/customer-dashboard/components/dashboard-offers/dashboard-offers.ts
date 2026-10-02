import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { finalize } from 'rxjs';
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
    this.api.myOffers().pipe(finalize(() => (this.loading = false))).subscribe({
      next: (response) => (this.offers = response?.data ?? []),
      error: (error) => (this.error = error?.error?.message || 'تعذر تحميل العروض.'),
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
