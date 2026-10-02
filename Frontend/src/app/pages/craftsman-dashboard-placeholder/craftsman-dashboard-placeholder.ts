import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';

// لوحة تحكم الحرفي: العروض المرسلة + تعديل البروفايل المهني + السوق المفتوح.
@Component({
  selector: 'app-craftsman-dashboard-placeholder',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <main class="container py-5" dir="rtl">
      <h1 class="fw-bold mb-1">لوحة تحكم الأسطى</h1>
      <p class="text-secondary mb-4">عروضك المرسلة، بروفايلك المهني، والطلبات المفتوحة في السوق.</p>
      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h5 class="fw-bold">عروضي المرسلة ({{ sent.length }})</h5>
              <div *ngIf="loading" class="text-secondary small">جاري التحميل...</div>
              <div *ngFor="let o of sent" class="border rounded-3 p-3 mb-2">
                <div class="fw-bold">{{ o.requestId?.title || o.requestId }} · {{ o.price }} ج.م</div>
                <div class="small text-secondary">{{ o.status }} · {{ o.duration }}</div>
                <button *ngIf="o.status === 'PENDING'" class="btn btn-sm btn-outline-danger mt-2" (click)="withdraw(o)">سحب العرض</button>
              </div>
              <div *ngIf="!sent.length && !loading" class="text-secondary small">لسه مبعتش عروض.</div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow-sm border-0 mb-3">
            <div class="card-body">
              <h5 class="fw-bold">إبعت عرض جديد</h5>
              <input class="form-control mb-2" [(ngModel)]="newOffer.requestId" placeholder="ID الطلب (من سوق الشغلانات)" />
              <div class="row g-2">
                <div class="col-6"><input type="number" class="form-control" [(ngModel)]="newOffer.price" placeholder="السعر" /></div>
                <div class="col-6"><input class="form-control" [(ngModel)]="newOffer.duration" placeholder="المدة (مثال: 3 أيام)" /></div>
              </div>
              <input class="form-control my-2" [(ngModel)]="newOffer.warranty" placeholder="الضمان" />
              <textarea class="form-control mb-2" [(ngModel)]="newOffer.notes" placeholder="ملاحظات"></textarea>
              <button class="btn btn-dark w-100" (click)="sendOffer()">إرسال العرض</button>
              <div *ngIf="msg" class="alert alert-info mt-2 small">{{ msg }}</div>
            </div>
          </div>
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h5 class="fw-bold">بروفايلي المهني</h5>
              <input class="form-control mb-2" [(ngModel)]="profile.profession" placeholder="الحرفة" />
              <input class="form-control mb-2" [(ngModel)]="profile.bio" placeholder="نبذة" />
              <input type="number" class="form-control mb-2" [(ngModel)]="profile.hourlyRate" placeholder="سعر الساعة" />
              <button class="btn btn-outline-dark w-100" (click)="saveProfile()">حفظ البروفايل</button>
              <div *ngIf="profileMsg" class="alert alert-info mt-2 small">{{ profileMsg }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card shadow-sm border-0 mt-4">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0">طلبات مفتوحة في السوق ({{ market.length }})</h5>
            <a routerLink="/jobs-market" class="btn btn-sm btn-outline-secondary">كل السوق</a>
          </div>
          <div class="row g-2">
            <div class="col-md-4" *ngFor="let j of market">
              <div class="border rounded-3 p-3">
                <div class="fw-bold">{{ j.title }}</div>
                <div class="small text-secondary">{{ j.area }}، {{ j.city }} · {{ j.budget?.min }}-{{ j.budget?.max }} ج.م</div>
                <code class="small">{{ j.id }}</code>
                <button class="btn btn-sm btn-dark w-100 mt-2" (click)="newOffer.requestId = j.id">اختار للعرض</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class CraftsmanDashboardPlaceholder {
  sent: any[] = [];
  market: any[] = [];
  loading = false;
  error = '';
  msg = '';
  profileMsg = '';
  newOffer: any = { requestId: '', price: null, duration: '', warranty: '', notes: '' };
  profile: any = { profession: '', bio: '', hourlyRate: null };

  constructor(private api: Marketplace) {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.api.sentOffers().subscribe({
      next: (r: any) => {
        this.sent = r?.data ?? [];
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message || '';
      },
    });
    this.api.listMarket({ limit: 6 }).subscribe({ next: (r: any) => (this.market = r?.data?.items ?? []) });
  }

  sendOffer(): void {
    this.msg = '';
    this.api.createOffer(this.newOffer).subscribe({
      next: (r: any) => {
        this.msg = r?.message || 'تم إرسال العرض بنجاح.';
        this.newOffer = { requestId: '', price: null, duration: '', warranty: '', notes: '' };
        this.refresh();
      },
      error: (e) => (this.msg = e?.error?.message || 'تعذر إرسال العرض.'),
    });
  }

  withdraw(o: any): void {
    this.api.withdrawOffer(o._id).subscribe({ next: () => this.refresh() });
  }

  saveProfile(): void {
    this.profileMsg = '';
    this.api.updateProfile(this.profile).subscribe({
      next: (r: any) => (this.profileMsg = r?.message || 'تم الحفظ.'),
      error: (e) => (this.profileMsg = e?.error?.message || 'تعذر الحفظ.'),
    });
  }
}

