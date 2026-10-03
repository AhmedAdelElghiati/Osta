import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AvailabilityService } from '../Service/availability.service';
import { AccountService } from '../Service/account.service';
import { Marketplace } from '../../services/marketplace';
import { Auth } from '../../services/auth';
import { API_ORIGIN } from '../../core/api.config';

interface Review { client: string; job: string; date: string; text: string; val: number; }

@Component({
  selector: 'app-dashboard-profile', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './profile.html', styleUrl: './profile.css'
})
export class Profile implements OnInit {
  Math = Math;
  private availability = inject(AvailabilityService);
  private accountService = inject(AccountService);
  private api = inject(Marketplace);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  profile: any = {};
  stats = { completedJobs: 0, acceptanceRate: 0, totalOffers: 0 };
  bio = '';
  skills: string[] = [];
  portfolio: { title: string; image: string }[] = [];
  reviews: Review[] = [];
  starList = [1, 2, 3, 4, 5];
  loading = true;
  saving = false;
  error = '';
  addWorkOpen = false;
  workTitle = '';
  workImage: File | null = null;
  toast = signal('');
  private toastTimer: any;

  ngOnInit() {
    this.api.artisanProfile().subscribe({
      next: res => {
        this.profile = res.data;
        this.bio = res.data.bio || '';
        this.skills = res.data.skills || [];
        this.portfolio = (res.data.portfolio || []).map((p: any) => ({ title: p.title, image: p.image || '' }));
        this.stats = res.data.stats;
        this.reviews = (res.data.reviews || []).map((r: any) => ({
          client: r.customerId?.name || 'عميل', job: r.requestId?.title || '',
          date: new Date(r.createdAt).toLocaleDateString('ar-EG'), text: r.comment, val: r.rating
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.error = 'تعذر تحميل البروفايل.'; this.cdr.markForCheck(); }
    });
  }

  get available() { return this.availability.isAvailable(); }
  set available(value: boolean) { this.availability.set(value); }
  get account() { return this.accountService.account; }
  get joinedAt() { return this.auth.currentUserValue?.createdAt || ''; }
  get initials() { return this.account.name.split(/\s+/).slice(0, 2).map(w => w[0]).join(' '); }
  get avg() { return Number(this.profile.rating || 0); }
  get avgText() { return this.avg.toFixed(1); }
  get distribution() {
    return [5, 4, 3, 2, 1].map(v => {
      const c = this.reviews.filter(r => r.val === v).length;
      return { v, c, pct: this.reviews.length ? c / this.reviews.length * 100 : 0 };
    });
  }
  imageUrl(image: string) { return image.startsWith('/uploads/') ? API_ORIGIN + image : image; }
  preview() { this.router.navigate(['/craftsmen-guide'], { queryParams: { artisan: this.profile._id } }); }

  saveBio() {
    if (this.saving) return;
    this.saving = true;
    this.api.updateArtisanProfile({ bio: this.bio }).subscribe({
      next: () => { this.saving = false; this.showToast('تم حفظ النبذة.'); },
      error: err => { this.saving = false; this.showToast(err.error?.message || 'تعذر حفظ النبذة.'); }
    });
  }
  openAddWork() { this.workTitle = ''; this.workImage = null; this.addWorkOpen = true; }
  closeAddWork() { if (!this.saving) this.addWorkOpen = false; }
  chooseWorkImage(event: Event) {
    this.workImage = (event.target as HTMLInputElement).files?.[0] || null;
  }
  addWork() {
    const title = this.workTitle.trim();
    if (!title || this.saving) return;
    this.saving = true;
    const save = (image: string) => this.savePortfolio([{ title, image }, ...this.portfolio], true);
    if (this.workImage) this.api.uploadImage(this.workImage, true).subscribe({
      next: res => save(res.data.url),
      error: err => { this.saving = false; this.showToast(err.error?.message || 'تعذر رفع الصورة.'); }
    });
    else save('');
  }
  removeWork(index: number) {
    if (!this.saving) { this.saving = true; this.savePortfolio(this.portfolio.filter((_, i) => i !== index)); }
  }
  private savePortfolio(items: { title: string; image: string }[], close = false) {
    this.api.updateArtisanProfile({ portfolio: items }).subscribe({
      next: () => { this.portfolio = items; this.saving = false; if (close) this.addWorkOpen = false; this.showToast('تم حفظ المعرض.'); },
      error: err => { this.saving = false; this.showToast(err.error?.message || 'تعذر حفظ المعرض.'); }
    });
  }
  showToast(message: string) {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3500);
    this.cdr.markForCheck();
  }
}
