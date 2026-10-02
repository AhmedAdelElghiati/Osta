import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../Service/availability.service';
import { AccountService } from '../Service/account.service';

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
export class Profile {
  Math = Math;
  private availability = inject(AvailabilityService);
  private accountService = inject(AccountService);

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

  bio =
    'سباك بخبرة 15 سنة في طنطا والمناطق المجاورة. متخصص في كشف التسريبات بالأجهزة الحديثة وتأسيس شبكات المياه للشقق والفلل.';

  skills = [
    'كشف تسريبات بالأجهزة',
    'تأسيس شبكات مياه',
    'تمديدات PPR',
    'صيانة سخانات',
    'معالجة رطوبة'
  ];

  portfolio = [
    'كشف تسريب بالأجهزة — منزل طنطا',
    'تأسيس حمام كامل — فيلا الكومي',
    'تركيب سخانات + شبكة نحاس',
    'تغيير مواسير PPR — شقة 120م',
    'معالجة رطوبة حائط',
    'شبكة مياه مطبخ مودرن'
  ];

  reviews: Review[] = [
    {
      client: 'أ. أحمد عثمان',
      job: 'صيانة سباكة ومحابس الحمام',
      date: 'مايو 2025',
      text: 'شغل نضيف والتزام — وصل في المعاد وشرحلي كل خطوة.',
      val: 5
    },
    {
      client: 'م. شريف فهمي',
      job: 'تأسيس شبكة مياه — فيلا',
      date: 'مايو 2025',
      text: 'أسطى فاهم شغله والسعر عادل جداً.',
      val: 5
    }
  ];

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

  saveBio() {
    this.showToast('تم تحديث النبذة بنجاح');
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