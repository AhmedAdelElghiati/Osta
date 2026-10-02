import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Offer, OfferStatus, OffersService } from '../Service/offers.service';

type TabKey = 'all' | 'pending' | 'accepted' | 'closed';

@Component({
  selector: 'app-dashboard-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sent-offers.html',
  styleUrl: './sent-offers.css'
})
export class SentOffers {

  private offersService = inject(OffersService);
  private router = inject(Router);

  activeTab: TabKey = 'all';

  tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'pending', label: 'بانتظار الرد' },
    { key: 'accepted', label: 'مقبولة' },
    { key: 'closed', label: 'مرفوضة / مسحوبة' }
  ];

  statusLabels: Record<OfferStatus, string> = {
    pending: 'بانتظار رد العميل',
    accepted: 'مقبول ✓',
    rejected: 'مرفوض',
    withdrawn: 'مسحوب'
  };

  confirmOffer: Offer | null = null;

  toast = '';
  private toastTimer: any;

  constructor() {
    this.offersService.accepted$
      .pipe(takeUntilDestroyed())
      .subscribe(({ offer }) => {
        this.showToast(
          `مبروك! ${offer.client} قبل عرضك — ${offer.price.toLocaleString('en-US')} ج.م اتحجزت في الضمان`
        );
      });
  }

  get offers() {
    return this.offersService.offers;
  }

  get filteredOffers() {
    return this.offers.filter(o => this.matches(o, this.activeTab));
  }

  count(key: TabKey) {
    return this.offers.filter(o => this.matches(o, key)).length;
  }

  private matches(o: Offer, key: TabKey) {
    switch (key) {
      case 'all': return true;
      case 'closed': return o.status === 'rejected' || o.status === 'withdrawn';
      default: return o.status === key;
    }
  }

  /* سحب العرض */

  askWithdraw(offer: Offer) {
    this.confirmOffer = offer;
  }

  closeConfirm() {
    this.confirmOffer = null;
  }

  confirmWithdraw() {
    if (!this.confirmOffer) return;
    this.offersService.withdraw(this.confirmOffer.id);
    this.confirmOffer = null;
    this.showToast('تم سحب عرضك');
  }

  /* فتح الشغلانة */

  openJob() {
    // عدّل المسار حسب الـ routes عندك
    this.router.navigate(['/dashboard/my-jobs']);
  }

  showToast(message: string) {
    this.toast = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 3500);
  }
}