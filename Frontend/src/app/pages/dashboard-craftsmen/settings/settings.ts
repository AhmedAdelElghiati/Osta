// import { Component } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// @Component({
//   selector: 'app-dashboard-settings',
//   standalone: true,
//   imports: [FormsModule],
//   templateUrl: './settings.html',
//   styleUrl: './settings.css'
// })
// export class Settings {

//   name = 'الأسطى إبراهيم صقر';

//   email = 'ibrahim@ossta.com';

//   phone = '0100 987 6543';

//   city = 'طنطا';

//   newPassword = '';


//   saveAccount() {

//     alert('تم حفظ بياناتك بنجاح');

//   }


//   changePassword() {

//     if (this.newPassword.length < 6) {

//       alert(
//         'كلمة المرور لازم تكون 6 حروف على الأقل'
//       );

//       return;

//     }

//     this.newPassword = '';

//     alert(
//       'تم تحديث كلمة المرور بنجاح'
//     );

//   }


//   deleteAccount() {

//     const confirmed =
//       confirm(
//         'هل أنت متأكد من حذف الحساب؟'
//       );

//     if (confirmed) {

//       alert(
//         'تم تسجيل طلب حذف الحساب'
//       );

//     }

//   }


// }


import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../Service/account.service';
import { WalletService } from '../Service/wallet.service';
import { Router } from '@angular/router';
import { Auth } from '../../../services/auth';
import { Marketplace } from '../../../services/marketplace';

@Component({
  selector: 'app-dashboard-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {

  private accountService = inject(AccountService);
  private wallet = inject(WalletService);
  private auth = inject(Auth);
  private router = inject(Router);
  private marketplace = inject(Marketplace);

  cities = ['طنطا', 'المحلة الكبرى', 'القاهرة', 'الجيزة'];
  providers = ['فودافون كاش', 'البنك الأهلي', 'إنستاباي'];

  /* بيانات الحساب */
  name = this.accountService.account.name;
  email = this.accountService.account.email;
  phone = this.accountService.account.phone;
  city = this.accountService.account.city;

  /* حساب السحب */
  provider = this.wallet.payout.provider;
  payoutNumber = this.wallet.payout.number;

  /* الأمان */
  currentPassword = '';
  newPassword = '';

  /* الإشعارات (مربوطة بالـ service مباشرة) */
  prefs = this.accountService.prefs;

  confirmDelete = false;

  toast = signal('');
  private toastTimer: any;

  saveAccount() {
    if (!this.name.trim()) {
      return this.showToast('اكتب اسمك الأول');
    }
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      return this.showToast('اكتب بريد إلكتروني صحيح');
    }
    if (this.phone.replace(/\D/g, '').length < 10) {
      return this.showToast('رقم الموبايل غير صحيح');
    }

    if (this.email.trim().toLowerCase() !== (this.accountService.account.email || '').toLowerCase()) {
      this.email = this.accountService.account.email;
      return this.showToast('مينفعش تغيير البريد الإلكتروني حاليًا');
    }

    // PATCH /api/users/me
    this.marketplace
      .updateProfile({
        name: this.name.trim(),
        phone: this.phone.replace(/\s+/g, ''),
        location: this.city,
      })
      .subscribe({
        next: () => {
          this.auth.fetchCurrentUser().subscribe();
          this.showToast('تم حفظ بياناتك بنجاح');
        },
        error: (error) => this.showToast(error?.error?.message || 'تعذر حفظ البيانات، حاول تاني.'),
      });
  }

  savePayout() {
    if (this.payoutNumber.replace(/\D/g, '').length < 8) {
      return this.showToast('رقم الحساب / الموبايل غير صحيح');
    }

    this.wallet.payout = { provider: this.provider, number: this.payoutNumber.trim() };
    this.showToast('تم تحديث حساب السحب — التحقق هيتم خلال 24 ساعة');
  }

  changePassword() {
    if (!this.currentPassword) {
      return this.showToast('اكتب كلمة المرور الحالية');
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(this.newPassword)) {
      return this.showToast('كلمة المرور لازم 8 حروف على الأقل وفيها حرف كبير وصغير ورقم ورمز');
    }

    // PATCH /api/auth/change-password
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.showToast('تم تحديث كلمة المرور بنجاح');
      },
      error: (error) => this.showToast(error?.error?.message || 'تعذر تغيير كلمة المرور، حاول تاني.'),
    });
  }

  deleteAccount() {
    this.confirmDelete = true;
  }

  closeConfirm() {
    this.confirmDelete = false;
  }

  confirmDeleteAccount() {
    this.confirmDelete = false;

    // DELETE /api/users/me (تعطيل الحساب)
    this.marketplace.deleteAccount().subscribe({
      next: () => {
        this.auth.clearCurrentUser();
        void this.router.navigate(['/']);
      },
      error: (error) => this.showToast(error?.error?.message || 'تعذر حذف الحساب، حاول تاني.'),
    });
  }

  showToast(message: string) {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3500);
  }
}