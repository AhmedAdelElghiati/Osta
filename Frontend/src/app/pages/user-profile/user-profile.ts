import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { Marketplace } from '../../services/marketplace';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile implements OnInit {
  user: any = null;

  name = '';
  phone = '';
  location = '';
  bio = '';

  currentPassword = '';
  newPassword = '';

  saving = false;
  savingPassword = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private auth: Auth,
    private marketplace: Marketplace,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const current = this.auth.currentUserValue;
    if (current) {
      this.applyUser(current);
    }
    this.auth.fetchCurrentUser().subscribe((me) => {
      if (me) {
        this.applyUser(me);
        this.cdr.markForCheck();
      }
    });
  }

  get isArtisan(): boolean {
    return this.user?.role === 'artisan';
  }

  get roleLabel(): string {
    return this.user?.role === 'artisan' ? 'أسطى' : this.user?.role === 'admin' ? 'مدير' : 'عميل';
  }

  get dashboardLink(): string {
    return this.user?.role === 'artisan'
      ? '/dashboard/home'
      : this.user?.role === 'admin'
        ? '/admin-dashboard'
        : '/customer-dashboard';
  }

  private applyUser(user: any): void {
    this.user = user;
    this.name = user.name || '';
    this.phone = user.phone || '';
    this.location = user.location || '';
    this.bio = user.artisan?.bio || '';
  }

  private show(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.message = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  saveProfile(): void {
    if (this.saving) return;
    if (this.name.trim().length < 3) {
      this.show('الاسم لازم يكون 3 حروف على الأقل', 'error');
      return;
    }

    this.saving = true;
    const body: any = { name: this.name.trim(), location: this.location.trim() };
    const phone = this.phone.replace(/\s+/g, '');
    if (phone) body.phone = phone;

    this.marketplace.updateProfile(body).subscribe({
      next: () => {
        const finish = () => {
          this.saving = false;
          this.auth.fetchCurrentUser().subscribe((me) => {
            if (me) this.applyUser(me);
            this.show('تم حفظ بياناتك بنجاح', 'success');
          });
        };
        if (this.isArtisan) {
          this.marketplace.updateArtisanProfile({ bio: this.bio.trim() }).subscribe({
            next: finish,
            error: finish,
          });
        } else {
          finish();
        }
      },
      error: (error) => {
        this.saving = false;
        this.show(error?.error?.message || 'تعذر حفظ البيانات، حاول تاني.', 'error');
      },
    });
  }

  changePassword(): void {
    if (this.savingPassword) return;
    if (!this.currentPassword) {
      this.show('اكتب كلمة المرور الحالية', 'error');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(this.newPassword)) {
      this.show('كلمة المرور الجديدة لازم 8 حروف وفيها حرف كبير وصغير ورقم ورمز', 'error');
      return;
    }

    this.savingPassword = true;
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.savingPassword = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.show('تم تغيير كلمة المرور بنجاح', 'success');
      },
      error: (error) => {
        this.savingPassword = false;
        this.show(error?.error?.message || 'تعذر تغيير كلمة المرور.', 'error');
      },
    });
  }
}
