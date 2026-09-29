import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-settings.html',
  styleUrl: './dashboard-settings.css',
})
export class DashboardSettings {
  @Output() accountDeleted = new EventEmitter<void>();
  // Profile
  profile = {
    name: 'م. أحمد عثمان',
    email: 'ahmed@domain.com',
    phone: '01012345678',
    city: 'مدينة نصر',
  };

  profileMessage = '';

  saveProfile() {
    this.profileMessage = 'تم حفظ التغييرات بنجاح.';

    setTimeout(() => {
      this.profileMessage = '';
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

    if (this.newPassword.length < 6) {
      this.passwordError = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
      return;
    }

    this.passwordMessage = 'تم تغيير كلمة المرور بنجاح.';

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
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
    this.deleteAccountModalOpen = true;
  }

  closeDeleteAccountModal() {
    this.deleteAccountModalOpen = false;
  }

  confirmDeleteAccount() {
    this.deleteAccountModalOpen = false;
    this.accountDeleted.emit();
  }
}
