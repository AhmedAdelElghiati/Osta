import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../../services/auth';

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
    const user = this.auth.currentUserValue;
    if (user) {
      this.profile = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.location,
      };
    }
  }

  profileMessage = '';

  // الباك اند مفيهوش endpoint لتعديل البيانات الشخصية لسه، فمش هنوهم اليوزر إنها اتحفظت.
  saveProfile() {
    this.profileMessage = 'تعديل البيانات الشخصية هيتفعّل قريبًا.';

    setTimeout(() => {
      this.profileMessage = '';
      this.cdr.markForCheck();
    }, 2500);
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

  // Saved Addresses
  addresses = [
    {
      id: 1,
      title: 'المنزل',
      address: 'شارع عباس العقاد، مدينة نصر، القاهرة',
    },
    {
      id: 2,
      title: 'العمل',
      address: 'شارع مصطفى النحاس، مدينة نصر، القاهرة',
    },
  ];

  addressModalOpen = false;

  addressTitle = '';
  addressText = '';
  editingAddressId: number | null = null;

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

    if (this.editingAddressId !== null) {
      const address = this.addresses.find((item) => item.id === this.editingAddressId);

      if (address) {
        address.title = this.addressTitle;
        address.address = this.addressText;
      }
    } else {
      this.addresses.push({
        id: Date.now(),
        title: this.addressTitle,
        address: this.addressText,
      });
    }

    this.closeAddressModal();
  }

  deleteAddress(id: number) {
    this.addresses = this.addresses.filter((address) => address.id !== id);
  }

  profileImage: string | null = localStorage.getItem('profileImage');

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.profileImage = reader.result as string;

      localStorage.setItem('profileImage', this.profileImage);
    };

    reader.readAsDataURL(file);
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

  // مفيش endpoint لحذف الحساب في الباك اند لسه، فمش هنعرض شاشة "تم الحذف" زيف.
  confirmDeleteAccount() {
    this.deleteAccountError = 'حذف الحساب هيتفعّل قريبًا. تواصل مع الدعم لو محتاج تحذف حسابك.';
  }
}
