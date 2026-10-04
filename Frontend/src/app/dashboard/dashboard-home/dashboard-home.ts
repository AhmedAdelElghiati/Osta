import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JobPhase, JobsService } from '../Service/jobs.service';
import { OffersService } from '../Service/offers.service';
import { Request, RequestsService } from '../Service/requests.service';
import { WalletService } from '../Service/wallet.service';
import { AvailabilityService } from '../Service/availability.service';
import { OfferModal } from '../offer-modal/offer-modal';
import { AccountService } from '../Service/account.service';
@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, OfferModal],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css'
})
export class Home {

  private jobsService = inject(JobsService);
  private offersService = inject(OffersService);
  private requestsService = inject(RequestsService);
  private wallet = inject(WalletService);
  private availability = inject(AvailabilityService);
  private account = inject(AccountService);

  today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

  selectedRequest: Request | null = null;

  toast = '';
  private toastTimer: any;

  phaseLabels: Record<JobPhase, string> = {
    'معاينة': 'معاينة مجدولة',
    'تنفيذ': 'جاري التنفيذ',
    'انتظار': 'بانتظار اعتماد العميل',
    'مكتمل': 'مكتملة'
  };

  phaseClass: Record<JobPhase, string> = {
    'معاينة': 'phase-visit',
    'تنفيذ': 'phase-progress',
    'انتظار': 'phase-review',
    'مكتمل': 'phase-done'
  };

  constructor() {
    this.offersService.accepted$
      .pipe(takeUntilDestroyed())
      .subscribe(({ offer }) =>
        this.showToast(`مبروك! ${offer.client} قبل عرضك — ${this.fmt(offer.price)} ج.م اتحجزت في الضمان`)
      );

    this.requestsService.arrived$
      .pipe(takeUntilDestroyed())
      .subscribe(r =>
        this.showToast(`طلب جديد في تخصصك: ${r.title} — ${r.budget ? this.fmt(r.budget) + ' ج.م' : 'ميزانية مرنة'}`)
      );
  }

  get pendingOffers() {
    return this.offersService.pendingOffers.length;
  }

  get userName() {
    return this.account.account.name || 'يا أسطى';
  }

  get rating() {
    return this.account.account.rating || 0;
  }
  get totalReviews() { return this.account.account.totalReviews || 0; }

  get activeJobs() {
    return this.jobsService.activeJobs;
  }

  get monthlyEarnings() {
    return this.wallet.earnings;
  }

  get requests() {
    return this.requestsService.suggested;
  }

  shortDesc(text: string) {
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
  }

  openOffer(request: Request) {
    if (!this.availability.isAvailable()) {
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
