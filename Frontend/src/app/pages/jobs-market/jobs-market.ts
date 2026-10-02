import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';

@Component({
  selector: 'app-jobs-market',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <main class="container py-5" dir="rtl">
      <h1 class="fw-bold mb-1">سوق الشغلانات والطلبات</h1>
      <p class="text-secondary mb-4">كل الطلبات المنشورة حاليًا — <b>{{ total }}</b> طلب مفتوح.</p>
      <div class="row g-2 mb-4">
        <div class="col-md-4"><input class="form-control" [(ngModel)]="search" placeholder="دوّر بكلمة..." /></div>
        <div class="col-md-3"><input class="form-control" [(ngModel)]="city" placeholder="المحافظة / المدينة" /></div>
        <div class="col-md-2"><button class="btn btn-dark w-100" (click)="load()">بحث</button></div>
      </div>
      <div *ngIf="loading" class="text-center text-secondary py-5">جاري التحميل...</div>
      <div class="row g-3" *ngIf="!loading">
        <div class="col-md-6 col-lg-4" *ngFor="let j of jobs">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-body">
              <span class="badge bg-light text-secondary">{{ j.craft?.name || 'خدمة' }}</span>
              <h5 class="fw-bold mt-2">{{ j.title }}</h5>
              <p class="text-secondary small">{{ j.description }}</p>
              <div class="small text-secondary">📍 {{ j.area }}، {{ j.city }} · 👤 {{ j.customerName }}</div>
              <div class="fw-bold mt-2">{{ j.budget?.min }} - {{ j.budget?.max }} ج.م</div>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="!loading && !jobs.length" class="alert alert-warning mt-3">مفيش طلبات منشورة دلوقتي.</div>
    </main>
  `,
})
export class JobsMarket implements OnInit {
  jobs: any[] = [];
  total = 0;
  loading = false;
  search = '';
  city = '';
  constructor(private api: Marketplace) {}
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading = true;
    this.api.listMarket({ search: this.search, city: this.city, limit: 24 }).subscribe({
      next: (r: any) => {
        this.jobs = r?.data?.items ?? [];
        this.total = r?.data?.pagination?.total ?? this.jobs.length;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
