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
        this.cdr.markForCheck();
      },
      error: (error) => (this.error = error?.error?.message || 'تعذر تحميل المستخدمين.'),
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
