import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../../services/auth';
import { Marketplace } from '../../../../services/marketplace';
import { API_ORIGIN } from '../../../../core/api.config';

@Component({
  selector: 'app-dashboard-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-settings.html',
  styleUrl: './dashboard-settings.css',
})
export class DashboardSettings implements OnInit {
  @Output() accountDeleted = new EventEmitter<void>();

  constructor(
    private auth: Auth,
    private api: Marketplace,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  // Profile (بيانات حقيقية من /auth/me)
  profile = {
    name: '',
    email: '',
    phone: '',
    city: '',
  };

  knownCities = ['مدينة نصر', 'مصر الجديدة', 'المعادي'];

  ngOnInit(): void {
    this.api.settings().subscribe({
      next: res => {
        this.addresses = (res.data.addresses || []).map((a: any) => ({ id: a.id, title: a.title, address: a.address }));
        this.notifications = res.data.notifications;
        this.payout = res.data.payout || this.payout;
        this.cdr.markForCheck();
      },
      error: () => { this.profileMessage = 'تعذر تحميل الإعدادات.'; this.cdr.markForCheck(); },
    });
    const user = this.auth.currentUserValue;
    if (user) {
      this.profileImage = user.profileImage?.startsWith('/uploads/') ? API_ORIGIN + user.profileImage : user.profileImage || null;
      this.profile = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.location,
      };
    }
  }

  profileMessage = '';
  profileLoading = false;

  // PATCH /api/users/me
  saveProfile() {
    this.profileMessage = '';
    this.profileLoading = true;
    this.api.updateProfile({ name: this.profile.name, phone: this.profile.phone, location: this.profile.city }).subscribe({
      next: (res: any) => {
        this.profileLoading = false;
        this.profileMessage = res?.message || 'تم حفظ بياناتك بنجاح.';
        this.auth.fetchCurrentUser().subscribe();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.profileMessage = '';
          this.cdr.markForCheck();
        }, 2500);
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileMessage = err?.error?.message || 'تعذر حفظ البيانات، حاول مرة أخرى.';
        this.cdr.markForCheck();
      },
    });
  }

  // Password
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordMessage = '';
  passwordError = '';

  passwordLoading = false;

  changePassword() {
    this.passwordMessage = '';
    this.passwordError = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'من فضلك أكمل جميع بيانات كلمة المرور.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'كلمة المرور الجديدة وتأكيدها غير متطابقين.';
      return;
    }

    // نفس قواعد الباك اند: 8 حروف على الأقل + كبير + صغير + رقم + رمز
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strong.test(this.newPassword)) {
      this.passwordError =
        'كلمة المرور لازم تكون 8 حروف على الأقل وفيها حرف كبير وصغير ورقم ورمز.';
      return;
    }

    this.passwordLoading = true;

    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordMessage = 'تم تغيير كلمة المرور بنجاح. هتسجل دخول من جديد.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.markForCheck();

        // الباك اند بيلغي كل الجلسات بعد تغيير كلمة المرور
        setTimeout(() => {
          this.auth.clearCurrentUser();
          this.router.navigate(['/login']);
        }, 1800);
      },
      error: (error) => {
        this.passwordLoading = false;
        this.passwordError =
          error?.error?.message === 'Current password is incorrect'
            ? 'كلمة المرور الحالية غير صحيحة.'
            : error?.error?.message || 'تعذر تغيير كلمة المرور، حاول مرة أخرى.';
        this.cdr.markForCheck();
      },
    });
  }

  // Notifications
  notifications = {
    requests: true,
    offers: true,
    messages: true,
    updates: true,
  };

  payout = { provider: '', number: '' };
  payoutSaving = false;
  payoutMessage = '';

  savePayout() {
    if (this.payoutSaving) return;
    this.payoutSaving = true;
    this.payoutMessage = '';
    this.api.saveSettings({ payout: this.payout }).subscribe({
      next: () => { this.payoutSaving = false; this.payoutMessage = 'تم حفظ حساب السحب.'; this.cdr.markForCheck(); },
      error: err => { this.payoutSaving = false; this.payoutMessage = err.error?.message || 'تعذر حفظ حساب السحب.'; this.cdr.markForCheck(); },
    });
  }

  // Saved Addresses
  addresses: { id: string; title: string; address: string }[] = [];

  addressModalOpen = false;

  addressTitle = '';
  addressText = '';
  editingAddressId: string | null = null;

  openAddAddress() {
    this.addressTitle = '';
    this.addressText = '';
    this.editingAddressId = null;

    this.addressModalOpen = true;
  }

  openEditAddress(address: any) {
    this.addressTitle = address.title;
    this.addressText = address.address;
    this.editingAddressId = address.id;

    this.addressModalOpen = true;
  }

  closeAddressModal() {
    this.addressModalOpen = false;
  }

  saveAddress() {
    if (!this.addressTitle.trim() || !this.addressText.trim()) {
      return;
    }

    const updated = { id: this.editingAddressId || crypto.randomUUID(), title: this.addressTitle.trim(), address: this.addressText.trim() };
    const addresses = this.editingAddressId ? this.addresses.map(a => a.id === updated.id ? updated : a) : [...this.addresses, updated];
    this.api.saveSettings({ addresses }).subscribe({
      next: () => { this.addresses = addresses; this.closeAddressModal(); this.cdr.markForCheck(); },
      error: err => { this.profileMessage = err.error?.message || 'تعذر حفظ العنوان.'; this.cdr.markForCheck(); },
    });
  }

  deleteAddress(id: string) {
    const addresses = this.addresses.filter(a => a.id !== id);
    this.api.saveSettings({ addresses }).subscribe({
      next: () => { this.addresses = addresses; this.cdr.markForCheck(); },
      error: () => { this.profileMessage = 'تعذر حذف العنوان.'; this.cdr.markForCheck(); },
    });
  }

  saveNotifications() {
    this.api.saveSettings({ notifications: this.notifications }).subscribe({
      error: () => { this.profileMessage = 'تعذر حفظ تفضيلات الإشعارات.'; this.cdr.markForCheck(); },
    });
  }

  profileImage: string | null = null;

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      return;
    }

    this.api.uploadImage(file).subscribe({
      next: res => { this.profileImage = API_ORIGIN + res.data.url; this.auth.fetchCurrentUser().subscribe(); this.cdr.markForCheck(); },
      error: err => { this.profileMessage = err.error?.message || 'تعذر رفع الصورة.'; this.cdr.markForCheck(); },
    });
  }

  // Delete Account
  deleteAccountModalOpen = false;

  openDeleteAccountModal() {
    this.deleteAccountError = '';
    this.deleteAccountModalOpen = true;
  }

  closeDeleteAccountModal() {
    this.deleteAccountModalOpen = false;
  }

  deleteAccountError = '';

  // DELETE /api/users/me
  confirmDeleteAccount() {
    this.deleteAccountError = '';
    this.api.deleteAccount().subscribe({
      next: () => {
        this.auth.clearCurrentUser();
        this.accountDeleted.emit();
      },
      error: (err) => {
        this.deleteAccountError = err?.error?.message || 'تعذر حذف الحساب، حاول مرة أخرى.';
        this.cdr.markForCheck();
      },
    });
  }
}
