import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../Service/availability.service';
import { AccountService } from '../Service/account.service';
import { Router } from '@angular/router';
import { Auth } from '../../../services/auth';
import { Marketplace } from '../../../services/marketplace';

interface Review {
  client: string;
  job: string;
  date: string;
  text: string;
  val: number;
}

@Component({
  selector: 'app-dashboard-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  Math = Math;
  private availability = inject(AvailabilityService);
  private accountService = inject(AccountService);
  private auth = inject(Auth);
  private marketplace = inject(Marketplace);
  private router = inject(Router);

  /* التواجد (مربوط بالنافبار) */
  get available() {
    return this.availability.isAvailable();
  }

  set available(value: boolean) {
    this.availability.set(value);
  }

  /* الاسم والمدينة (من الإعدادات) */
  get account() {
    return this.accountService.account;
  }

  get initials() {
    return this.account.name
      .replace(/^الأسطى\s+/, '')
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0])
      .join(' ');
  }

  bio = '';

  skills: string[] = [];

  // المعرض ملوش endpoint في الباك — بيتحفظ في الجلسة الحالية بس
  portfolio: string[] = [];

  reviews: Review[] = [];

  profession = '';
  verified = false;
  memberSince = '';

  private readonly professionNames: Record<string, string> = {
    plumbing: 'سباك',
    electricity: 'كهربائي',
    carpentry: 'نجار',
    painting: 'نقاش',
    'air-conditioning': 'فني تكييف',
    aluminum: 'فني ألوميتال',
  };

  ngOnInit(): void {
    const user = this.auth.currentUserValue;
    if (user) {
      this.applyUser(user);
    } else {
      this.auth.fetchCurrentUser().subscribe((me) => me && this.applyUser(me));
    }
  }

  private applyUser(user: any): void {
    const artisan = user?.artisan;
    this.profession = this.professionNames[artisan?.profession] ?? artisan?.profession ?? 'أسطى';
    this.verified = !!artisan?.isVerified;
    this.bio = artisan?.bio || '';
    this.skills = Array.isArray(artisan?.skills) ? artisan.skills : [];
    this.memberSince = user?.createdAt ? String(new Date(user.createdAt).getFullYear()) : '';

    if (artisan?._id) {
      this.marketplace.getArtisan(String(artisan._id)).subscribe({
        next: (response) => {
          const items: any[] = response?.data?.reviews ?? [];
          this.reviews = items.map((r) => ({
            client: 'عميل',
            job: '',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : '',
            text: r.comment || 'بدون تعليق',
            val: Number(r.rating || 0),
          }));
        },
      });
    }
  }

  starList = [1, 2, 3, 4, 5];

  addWorkOpen = false;
  workTitle = '';

  toast = signal('');
  private toastTimer: any;

  /* ========== التقييمات ========== */

  get avg() {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.val, 0) / this.reviews.length;
  }

  get avgText() {
    return this.avg.toFixed(1);
  }

  get distribution() {
    const rows = [5, 4, 3, 2, 1].map(v => ({
      v,
      c: this.reviews.filter(r => r.val === v).length
    }));
    const max = Math.max(...rows.map(r => r.c), 1);
    return rows.map(r => ({ ...r, pct: (r.c / max) * 100 }));
  }

  /* ========== النبذة ========== */

  // يفتح بروفايلي في دليل الأسطوات زي ما العميل شايفه
  previewAsClient() {
    const id = this.auth.currentUserValue?.artisan?._id;
    if (!id) {
      this.showToast('بروفايلك لسه بيتحمّل، جرّب تاني بعد ثانية');
      return;
    }
    this.router.navigate(['/craftsmen-guide'], { queryParams: { artisan: id } });
  }

  saveBio() {
    // PATCH /api/v1/artisans/me/profile
    this.marketplace.updateArtisanProfile({ bio: this.bio.trim() }).subscribe({
      next: () => {
        this.auth.fetchCurrentUser().subscribe();
        this.showToast('تم تحديث النبذة بنجاح');
      },
      error: (error) => this.showToast(error?.error?.message || 'تعذر تحديث النبذة، حاول تاني.'),
    });
  }

  /* ========== المعرض ========== */

  openAddWork() {
    this.workTitle = '';
    this.addWorkOpen = true;
  }

  closeAddWork() {
    this.addWorkOpen = false;
  }

  addWork() {
    const title = this.workTitle.trim();
    if (!title) {
      this.showToast('اكتب وصف العمل الأول');
      return;
    }

    this.portfolio.unshift(title);
    this.addWorkOpen = false;
    this.showToast('تمت إضافة العمل لمعرضك');
  }

  removeWork(index: number) {
    this.portfolio.splice(index, 1);
    this.showToast('تم حذف العمل من المعرض');
  }

  showToast(message: string) {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3500);
  }
}