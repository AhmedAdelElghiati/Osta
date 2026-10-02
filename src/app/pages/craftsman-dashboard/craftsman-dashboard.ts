import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { Marketplace, OfferVm } from '../../services/marketplace';

interface ArtisanProfileForm {
  profession: string;
  bio: string;
  experienceYears: number | null;
  hourlyRate: number | null;
  skills: string;
  serviceAreas: string;
}

interface OfferForm {
  requestId: string;
  price: number | null;
  duration: string;
  warranty: string;
  notes: string;
}

@Component({
  selector: 'app-craftsman-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="container py-5" dir="rtl">
      <header class="mb-4">
        <h1 class="fw-bold mb-1">لوحة تحكم الأسطى</h1>
        <p class="text-secondary mb-0">إدارة عروضك وبروفايلك والطلبات المفتوحة من مكان واحد.</p>
      </header>

      <div *ngIf="error" class="alert alert-danger" role="alert">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success" role="status">{{ success }}</div>

      <div class="row g-4">
        <section class="col-lg-7" aria-labelledby="market-heading">
          <!-- Notifications -->
          <div class="card shadow-sm border-0 mb-4" *ngIf="notifications.length > 0">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="h5 fw-bold mb-0">الإشعارات</h2>
                <button type="button" class="btn btn-sm btn-link text-decoration-none" (click)="markAllNotificationsRead()">قراءة الكل</button>
              </div>
              <div *ngFor="let notification of notifications" class="border rounded-3 p-3 mb-2 d-flex gap-3 align-items-start" [class.bg-light]="!notification.isRead" (click)="markNotificationRead(notification)" style="cursor: pointer;">
                <div class="notification-icon flex-shrink-0 text-primary">
                  <i class="bi" [ngClass]="notification.icon || 'bi-bell'"></i>
                </div>
                <div class="flex-grow-1">
                  <strong class="d-block" [class.text-primary]="!notification.isRead">{{ notification.title }}</strong>
                  <p class="mb-1 small">{{ notification.description }}</p>
                  <small class="d-block text-secondary">{{ notification.createdAt | date:'short' }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Jobs -->
          <div class="card shadow-sm border-0 mb-4" *ngIf="activeJobs.length > 0">
            <div class="card-body">
              <h2 class="h5 fw-bold mb-3">وظائفي الحالية ({{ activeJobs.length }})</h2>
              <div *ngFor="let job of activeJobs" class="border rounded-3 p-3 mb-2 border-primary">
                <div class="d-flex justify-content-between">
                  <div class="fw-bold">{{ job.title }}</div>
                  <span class="badge bg-primary">{{ job.status }}</span>
                </div>
                <div class="small text-secondary">{{ job.location?.area }}، {{ job.location?.city }} · العميل: {{ job.customerId?.name }}</div>
                <div class="mt-2 fw-bold text-success">{{ job.acceptedPrice }} ج.م</div>
              </div>
            </div>
          </div>

          <!-- Market -->
          <div class="card shadow-sm border-0 h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 id="market-heading" class="h5 fw-bold mb-0">طلبات مفتوحة في السوق</h2>
                <a routerLink="/jobs-market" class="btn btn-sm btn-outline-secondary">كل السوق</a>
              </div>
              <div *ngIf="loadingMarket" class="text-secondary">جاري تحميل الطلبات...</div>
              <div *ngFor="let request of market" class="border rounded-3 p-3 mb-2">
                <div class="fw-bold">{{ request.title }}</div>
                <div class="small text-secondary">{{ request.area }}، {{ request.city }} · {{ request.budget?.min }}-{{ request.budget?.max }} ج.م</div>
                <button type="button" class="btn btn-sm btn-dark mt-2" (click)="selectRequest(request.id)">اختيار لإرسال عرض</button>
              </div>
              <p *ngIf="!loadingMarket && !market.length" class="text-secondary mb-0">لا توجد طلبات مفتوحة حالياً.</p>
            </div>
          </div>
        </section>

        <section class="col-lg-5" aria-labelledby="offer-heading">
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-body">
              <h2 id="offer-heading" class="h5 fw-bold">إرسال عرض</h2>
              <input class="form-control mb-2" [(ngModel)]="offer.requestId" name="requestId" placeholder="معرّف الطلب" required />
              <input class="form-control mb-2" type="number" min="1" [(ngModel)]="offer.price" name="price" placeholder="السعر" required />
              <input class="form-control mb-2" [(ngModel)]="offer.duration" name="duration" placeholder="المدة" required />
              <input class="form-control mb-2" [(ngModel)]="offer.warranty" name="warranty" placeholder="الضمان" />
              <textarea class="form-control mb-2" [(ngModel)]="offer.notes" name="notes" placeholder="ملاحظات" rows="3"></textarea>
              <button type="button" class="btn btn-dark w-100" [disabled]="savingOffer" (click)="sendOffer()">{{ savingOffer ? 'جاري الإرسال...' : 'إرسال العرض' }}</button>
            </div>
          </div>

          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h2 class="h5 fw-bold">بروفايلي المهني</h2>
              <input class="form-control mb-2" [(ngModel)]="profile.profession" name="profession" placeholder="الحرفة" required />
              <textarea class="form-control mb-2" [(ngModel)]="profile.bio" name="bio" placeholder="نبذة مهنية" rows="3"></textarea>
              <input class="form-control mb-2" type="number" min="0" [(ngModel)]="profile.experienceYears" name="experienceYears" placeholder="سنوات الخبرة" />
              <input class="form-control mb-2" type="number" min="0" [(ngModel)]="profile.hourlyRate" name="hourlyRate" placeholder="سعر الساعة" />
              <input class="form-control mb-2" [(ngModel)]="profile.skills" name="skills" placeholder="المهارات، مفصولة بفواصل" />
              <input class="form-control mb-2" [(ngModel)]="profile.serviceAreas" name="serviceAreas" placeholder="مناطق الخدمة، مفصولة بفواصل" />
              <button type="button" class="btn btn-outline-dark w-100" [disabled]="savingProfile" (click)="saveProfile()">{{ savingProfile ? 'جاري الحفظ...' : 'حفظ البروفايل' }}</button>
            </div>
          </div>
        </section>
      </div>

      <section class="card shadow-sm border-0 mt-4" aria-labelledby="offers-heading">
        <div class="card-body">
          <h2 id="offers-heading" class="h5 fw-bold">عروضي المرسلة ({{ sentOffers.length }})</h2>
          <div *ngIf="loadingOffers" class="text-secondary">جاري تحميل العروض...</div>
          <div *ngFor="let sentOffer of sentOffers" class="border rounded-3 p-3 mb-2 d-flex justify-content-between align-items-center gap-3">
            <div><div class="fw-bold">{{ sentOffer.requestId?.title || sentOffer.requestId }} · {{ sentOffer.price }} ج.م</div><div class="small text-secondary">{{ sentOffer.status }} · {{ sentOffer.duration }}</div></div>
            <button *ngIf="sentOffer.status === 'PENDING'" type="button" class="btn btn-sm btn-outline-danger" (click)="withdraw(sentOffer)">سحب العرض</button>
          </div>
          <p *ngIf="!loadingOffers && !sentOffers.length" class="text-secondary mb-0">لم ترسل عروضاً بعد.</p>
        </div>
      </section>
    </main>
  `,
})
export class CraftsmanDashboard implements OnInit {
  private readonly api = inject(Marketplace);
  private readonly auth = inject(Auth);

  market: any[] = [];
  sentOffers: OfferVm[] = [];
  loadingMarket = false;
  loadingOffers = false;
  savingOffer = false;
  savingProfile = false;
  error = '';
  success = '';
  offer: OfferForm = this.emptyOffer();
  profile: ArtisanProfileForm = this.emptyProfile();
  notifications: any[] = [];
  activeJobs: any[] = [];

  ngOnInit(): void {
    const artisan = this.auth.currentUserValue?.artisan;
    if (artisan) {
      this.profile = {
        profession: artisan.profession || '',
        bio: artisan.bio || '',
        experienceYears: artisan.experienceYears ?? null,
        hourlyRate: artisan.hourlyRate ?? null,
        skills: artisan.skills?.join(', ') || '',
        serviceAreas: artisan.serviceAreas?.join(', ') || '',
      };
    }
    this.refresh();
  }

  refresh(): void {
    this.error = '';
    this.loadOffers();
    this.loadNotifications();
    this.loadActiveJobs();
    this.loadingMarket = true;
    this.api.listMarket({ limit: 6 }).subscribe({
      next: (response) => (this.market = response?.data?.items ?? []),
      error: () => (this.error = 'تعذر تحميل الطلبات المفتوحة.'),
      complete: () => (this.loadingMarket = false),
    });
  }

  selectRequest(requestId: string): void {
    this.offer.requestId = requestId;
    document.getElementById('offer-heading')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  sendOffer(): void {
    if (!this.offer.requestId || !this.offer.price || !this.offer.duration) {
      this.error = 'معرّف الطلب والسعر والمدة مطلوبة لإرسال العرض.';
      return;
    }
    this.savingOffer = true;
    this.error = '';
    this.api.createOffer(this.offer).subscribe({
      next: (response) => { this.success = response?.message || 'تم إرسال العرض بنجاح.'; this.offer = this.emptyOffer(); this.loadOffers(); },
      error: (error) => (this.error = error?.error?.message || 'تعذر إرسال العرض.'),
      complete: () => (this.savingOffer = false),
    });
  }

  withdraw(offer: OfferVm): void {
    this.api.withdrawOffer(offer._id).subscribe({
      next: () => { this.success = 'تم سحب العرض.'; this.loadOffers(); },
      error: (error) => (this.error = error?.error?.message || 'تعذر سحب العرض.'),
    });
  }

  saveProfile(): void {
    if (!this.profile.profession.trim()) { this.error = 'الحرفة مطلوبة.'; return; }
    this.savingProfile = true;
    this.error = '';
    const payload = {
      ...this.profile,
      skills: this.splitList(this.profile.skills),
      serviceAreas: this.splitList(this.profile.serviceAreas),
    };
    this.api.updateArtisanProfile(payload).subscribe({
      next: (response) => (this.success = response?.message || 'تم حفظ البروفايل.'),
      error: (error) => (this.error = error?.error?.message || 'تعذر حفظ البروفايل.'),
      complete: () => (this.savingProfile = false),
    });
  }

  private loadOffers(): void {
    this.loadingOffers = true;
    this.api.sentOffers().subscribe({
      next: (response) => (this.sentOffers = response?.data ?? []),
      error: () => (this.error = 'تعذر تحميل عروضك.'),
      complete: () => (this.loadingOffers = false),
    });
  }

  private loadNotifications(): void {
    this.api.notifications().subscribe({
      next: (res) => (this.notifications = res.data || []),
    });
  }

  private loadActiveJobs(): void {
    this.api.myJobs().subscribe({
      next: (res) => (this.activeJobs = res.data?.items || []),
    });
  }

  markAllNotificationsRead() {
    this.api.markAllNotificationsRead().subscribe(() => {
      this.notifications.forEach((n) => n.isRead = true);
    });
  }

  markNotificationRead(notification: any) {
    if (notification.isRead) return;
    this.api.markNotificationRead(notification._id).subscribe(() => {
      notification.isRead = true;
    });
  }

  private splitList(value: string): string[] { return value.split(',').map((item) => item.trim()).filter(Boolean); }
  private emptyOffer(): OfferForm { return { requestId: '', price: null, duration: '', warranty: '', notes: '' }; }
  private emptyProfile(): ArtisanProfileForm { return { profession: '', bio: '', experienceYears: null, hourlyRate: null, skills: '', serviceAreas: '' }; }
}
