import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../Service/account.service';
import { WalletService } from '../Service/wallet.service';
import { Marketplace } from '../../services/marketplace';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-dashboard-settings', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './settings.html', styleUrl: './settings.css'
})
export class Settings implements OnInit {
  private accountService = inject(AccountService);
  private wallet = inject(WalletService);
  private api = inject(Marketplace);
  private auth = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  cities = ['طنطا', 'المحلة الكبرى', 'القاهرة', 'الجيزة'];
  providers = ['فودافون كاش', 'البنك الأهلي', 'إنستاباي'];
  name = this.accountService.account.name;
  email = this.accountService.account.email;
  phone = this.accountService.account.phone;
  city = this.accountService.account.city;
  provider = '';
  payoutNumber = '';
  currentPassword = '';
  newPassword = '';
  prefs = this.accountService.prefs;
  confirmDelete = false;
  toast = signal('');
  private toastTimer: any;

  ngOnInit() {
    this.api.settings().subscribe({
      next: res => {
        this.provider = res.data.payout?.provider || '';
        this.payoutNumber = res.data.payout?.number || '';
        const n = res.data.notifications;
        this.prefs = { newRequests: n.requests, offerUpdates: n.offers, messages: n.messages, escrow: n.updates };
        this.cdr.markForCheck();
      },
      error: () => this.showToast('تعذر تحميل الإعدادات.')
    });
  }
  saveAccount() {
    this.api.updateProfile({ name: this.name.trim(), phone: this.phone.trim(), location: this.city }).subscribe({
      next: () => { this.auth.fetchCurrentUser().subscribe(); this.showToast('تم حفظ بياناتك.'); },
      error: err => this.showToast(err.error?.message || 'تعذر حفظ البيانات.')
    });
  }
  savePayout() {
    if (!this.provider || this.payoutNumber.replace(/\D/g, '').length < 8) return this.showToast('راجع بيانات حساب السحب.');
    this.api.saveSettings({ payout: { provider: this.provider, number: this.payoutNumber.trim() } }).subscribe({
      next: () => { this.wallet.payout = { provider: this.provider, number: this.payoutNumber.trim() }; this.showToast('تم حفظ حساب السحب.'); },
      error: err => this.showToast(err.error?.message || 'تعذر حفظ حساب السحب.')
    });
  }
  savePrefs() {
    this.api.saveSettings({ notifications: { requests: this.prefs.newRequests, offers: this.prefs.offerUpdates,
      messages: this.prefs.messages, updates: this.prefs.escrow } }).subscribe({
      next: () => { this.accountService.prefs = this.prefs; },
      error: () => this.showToast('تعذر حفظ تفضيلات الإشعارات.')
    });
  }
  changePassword() {
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => { this.auth.clearCurrentUser(); this.router.navigate(['/login']); },
      error: err => this.showToast(err.error?.message || 'تعذر تغيير كلمة المرور.')
    });
  }
  deleteAccount() { this.confirmDelete = true; }
  closeConfirm() { this.confirmDelete = false; }
  confirmDeleteAccount() {
    this.api.deleteAccount().subscribe({
      next: () => { this.auth.clearCurrentUser(); this.router.navigate(['/login']); },
      error: err => this.showToast(err.error?.message || 'تعذر حذف الحساب.')
    });
  }
  showToast(message: string) {
    this.toast.set(message); clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3500); this.cdr.markForCheck();
  }
}
