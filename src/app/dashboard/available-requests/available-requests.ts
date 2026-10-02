import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Request, RequestsService } from '../Service/requests.service';
import { AvailabilityService } from '../Service/availability.service';
import { OffersService } from '../Service/offers.service';
import { SearchService } from '../Service/search.service';
import { OfferModal } from '../offer-modal/offer-modal';

type SortKey = 'new' | 'budget' | 'near';

@Component({
  selector: 'app-available-requests',
  standalone: true,
  imports: [CommonModule, OfferModal],
  templateUrl: './available-requests.html',
  styleUrl: './available-requests.css'
})
export class AvailableRequests {

  private requestsService = inject(RequestsService);
  private availability = inject(AvailabilityService);
  private offersService = inject(OffersService);
  private searchService = inject(SearchService);

  currentSort: SortKey = 'new';

  sorts: { key: SortKey; label: string }[] = [
    { key: 'new', label: 'الأحدث' },
    { key: 'budget', label: 'الأعلى ميزانية' },
    { key: 'near', label: 'الأقرب لي' }
  ];

  selectedRequest: Request | null = null;

  toast = '';
  private toastTimer: any;

  constructor() {
    this.requestsService.arrived$
      .pipe(takeUntilDestroyed())
      .subscribe(r =>
        this.showToast(`طلب جديد في تخصصك: ${r.title} — ${r.budget ? this.fmt(r.budget) + ' ج.م' : 'ميزانية مرنة'}`)
      );

    this.offersService.accepted$
      .pipe(takeUntilDestroyed())
      .subscribe(({ offer }) =>
        this.showToast(`مبروك! ${offer.client} قبل عرضك — ${this.fmt(offer.price)} ج.م اتحجزت في الضمان`)
      );
  }

  get isAvailable() {
    return this.availability.isAvailable();
  }

   get searchQuery() {
    return this.searchService.query();
  }

  get requests(): Request[] {
    let list = this.requestsService.openRequests;

    const q = this.searchQuery.toLowerCase();
    if (q) {
      list = list.filter(r =>
        (r.title + ' ' + r.client + ' ' + r.area).toLowerCase().includes(q)
      );
    }

    if (this.currentSort === 'budget') {
      list = [...list].sort((a, b) => (b.budget || 0) - (a.budget || 0));
    }

    if (this.currentSort === 'near') {
      list = [...list].sort((a, b) => a.distKm - b.distKm);
    }

    return list;
  }

   clearSearch() {
    this.searchService.query.set('');
  }
  /* ========== تقديم عرض ========== */

  openOffer(request: Request) {
    if (!this.isAvailable) {
      this.showToast('فعّل وضع «متاح» من بروفايلك الأول عشان تقدر تقدم عروض');
      return;
    }
    this.selectedRequest = request;
  }

  closeOffer() {
    this.selectedRequest = null;
  }

  onOfferSent(e: { price: number; client: string }) {
    this.showToast(`تم إرسال عرضك (${this.fmt(e.price)} ج.م) لـ ${e.client} — هتصلك إجابته خلال وقت قصير`);
  }

  showToast(message: string) {
    this.toast = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 3500);
  }

  fmt(n: number) {
    return n.toLocaleString('en-US');
  }
}