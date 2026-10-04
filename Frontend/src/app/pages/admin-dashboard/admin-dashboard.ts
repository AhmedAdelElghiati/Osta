import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Marketplace } from '../../services/marketplace';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  constructor(private api: AdminService, private cdr: ChangeDetectorRef, private marketplace: Marketplace) {}
  replyDrafts: Record<string, string> = {};
  banUser: any = null;
  banReason = '';
  banSaving = false;
  banError = '';
  openBan(user: any): void {
    if (this.banSaving || user.role === 'admin') return;
    this.banUser = user;
    this.banReason = '';
    this.banError = '';
  }
  confirmBan(): void {
    if (!this.banUser || this.banSaving) return;
    const user = this.banUser;
    const banned = !user.isBanned;
    const reason = this.banReason.trim();
    if (banned && (reason.length < 3 || reason.length > 1000)) { this.banError = 'اكتب سببًا من 3 إلى 1000 حرف.'; return; }
    this.banSaving = true;
    this.api.banUser(user._id, banned, reason).subscribe({
      next: res => {
        Object.assign(user, res.data);
        for (const item of this.users) if (String(item._id) === String(user._id)) Object.assign(item, res.data);
        for (const item of this.artisans) if (String(item.userId?._id) === String(user._id)) Object.assign(item.userId, res.data);
        this.banUser = null; this.banSaving = false; this.cdr.markForCheck();
      },
      error: err => { this.banError = err.error?.message || 'تعذر تغيير الحظر.'; this.banSaving = false; this.cdr.markForCheck(); },
    });
  }
  sendReply(message: any) {
    const text = this.replyDrafts[message._id]?.trim();
    if (!text) return;
    this.marketplace.replyToTicket(message._id, text).subscribe({
      next: res => { Object.assign(message, res.data); this.replyDrafts[message._id] = ''; this.cdr.markForCheck(); },
      error: err => { this.error = err.error?.message || 'تعذر إرسال الرد.'; this.cdr.markForCheck(); },
    });
  }

  loading = true;
  error = '';
  search = '';
  role = '';
  overview: any = {};
  users: any[] = [];
  artisans: any[] = [];
  messages: any[] = [];
  activeTab: 'overview' | 'users' | 'artisans' | 'support' | 'disputes' = 'overview';
  disputes: any[] = [];
  decisions: Record<string, string> = {};
  disputeSaving = '';
  disputeLabel(status: string): string { return ({ OPEN: 'مفتوح', UNDER_REVIEW: 'قيد المراجعة', RESOLVED: 'تم الحل', REJECTED: 'مرفوض' } as Record<string, string>)[status] || status; }
  loadDisputes(): void {
    this.api.disputes().subscribe({
      next: res => { this.disputes = res.data || []; this.cdr.markForCheck(); },
      error: err => { this.error = err.error?.message || 'تعذر تحميل النزاعات.'; this.cdr.markForCheck(); },
    });
  }
  reviewDispute(job: any, status: string): void {
    const decision = this.decisions[job._id]?.trim() || '';
    if (this.disputeSaving) return;
    if (decision.length < 10 || decision.length > 5000) { this.error = 'اكتب قرارًا من 10 إلى 5000 حرف.'; return; }
    this.disputeSaving = job._id;
    this.error = '';
    this.api.reviewDispute(job._id, status, decision).subscribe({
      next: res => { job.dispute = res.data.dispute; this.disputeSaving = ''; this.decisions[job._id] = ''; this.cdr.markForCheck(); },
      error: err => { this.error = err.error?.message || 'تعذر تحديث النزاع.'; this.disputeSaving = ''; this.cdr.markForCheck(); },
    });
  }
  userPage = 1;
  userTotalPages = 1;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.api.overview().subscribe({
      next: (response) => {
        this.overview = response?.data ?? {};
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'تعذر تحميل لوحة الإدارة.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
    this.loadUsers();
    this.loadArtisans();
    this.loadDisputes();
    this.api.contact().subscribe({
      next: (response) => {
        this.messages = response?.data ?? [];
        this.cdr.markForCheck();
      },
    });
  }

  loadArtisans(): void {
    this.api.artisans().subscribe({
      next: (response) => {
        this.artisans = response?.data ?? [];
        this.cdr.markForCheck();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر تحميل الحرفيين.'),
    });
  }

  toggleVerification(artisan: any): void {
    const nextValue = !artisan.isVerified;
    this.api.verifyArtisan(artisan._id, nextValue).subscribe({
      next: (response) => {
        if (response?.data) artisan.isVerified = response.data.isVerified;
        this.cdr.markForCheck();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر تحديث التوثيق.'),
    });
  }

  loadUsers(): void {
    this.api.users(this.search, this.role).subscribe({
      next: (response) => {
        this.users = response?.data?.items ?? [];
        this.userPage = response?.data?.pagination?.page || 1;
        this.userTotalPages = response?.data?.pagination?.totalPages || 1;
        this.cdr.markForCheck();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر تحميل المستخدمين.'),
    });
  }

  artisanUserId(artisan: any): string { return String(artisan.userId?._id || artisan.userId || ''); }

  setTab(tab: 'overview' | 'users' | 'artisans' | 'support' | 'disputes'): void { this.activeTab = tab; }
  roleLabel(role: string): string { return role === 'artisan' ? 'صنايعي' : role === 'admin' ? 'مدير' : 'عميل'; }
  nextUsersPage(delta: number): void {
    const next = this.userPage + delta;
    if (next < 1 || next > this.userTotalPages) return;
    this.userPage = next;
    this.api.users(this.search, this.role, next).subscribe({
      next: response => { this.users = response?.data?.items ?? []; this.cdr.markForCheck(); },
      error: error => { this.error = error?.error?.message || 'تعذر تحميل المستخدمين.'; this.cdr.markForCheck(); },
    });
  }

  toggleUser(user: any): void {
    this.api.toggleUser(user._id).subscribe({
      next: (response) => {
        const updated = response?.data;
        if (updated) user.isActive = updated.isActive;
        this.cdr.markForCheck();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر تحديث حالة المستخدم.'),
    });
  }

  markMessageRead(message: any): void {
    this.api.updateContact(message._id, 'READ').subscribe({
      next: (response) => {
        if (response?.data) message.status = response.data.status;
        this.cdr.markForCheck();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر تحديث الرسالة.'),
    });
  }
}
