import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <main class="container py-5" dir="rtl">
      <h1 class="fw-bold mb-3">شغالين إزاي؟</h1>
      <p class="text-secondary mb-4">اعمل طلب → استقبل عروض من الأسطوات → اقبل العرض المناسب → قيّم الخدمة.</p>
      <div class="row g-3">
        <div class="col-md-3" *ngFor="let s of steps; let i = index">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-body">
              <div class="fs-3">{{ ['📝', '📩', '🤝', '⭐'][i] }}</div>
              <h5 class="fw-bold mt-2">{{ s.title }}</h5>
              <p class="text-secondary small">{{ s.desc }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="alert alert-info mt-4" *ngIf="stats">
        طلبات مفتوحة الآن: <b>{{ stats.openJobs }}</b> · خدمات مكتملة: <b>{{ stats.completedJobs }}</b> ·
        أسطوات مسجلين: <b>{{ stats.artisansCount }}</b>
      </div>
      <a routerLink="/customer-dashboard" [queryParams]="{ newRequest: 'true' }" class="btn btn-dark mt-3">اعمل طلب جديد</a>
    </main>
  `,
})
export class HowItWorks implements OnInit {
  stats: any = null;
  steps = [
    { title: '1. اعمل طلب', desc: 'اكتب اللي محتاجه وحدد منطقتك وميزانيتك.' },
    { title: '2. استقبل عروض', desc: 'الأسطوات المتاحين يبعتولك أسعار ومدد تنفيذ.' },
    { title: '3. اقبل العرض', desc: 'قارن واقبل العرض المناسب لطلبك.' },
    { title: '4. قيّم الخدمة', desc: 'بعد التنفيذ قيّم الأسطى عشان تساعد غيرك.' },
  ];
  constructor(private api: Marketplace) {}
  ngOnInit(): void {
    this.api.marketStats().subscribe({ next: (r: any) => (this.stats = r?.data ?? null) });
  }
}
