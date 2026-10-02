import { Component, ChangeDetectorRef } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  activeTab: 'client' | 'craftsman' = 'craftsman';
  showPassword = false;
  emailOrPhone = '';
  password = '';
  rememberMe = false;
  showSuccessMessage = false;
  toastTitle = '';
  toastMessage = '';
  toastIcon = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}
  switchTab(tab: 'client' | 'craftsman'): void {
    this.activeTab = tab;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    // الباك اند بيدوّر بالإيميل بس دلوقتي، فمؤقتًا الحقل بيتبعت كإيميل
    // (التوضيح ده انعمل في الـ label والـ placeholder بدل الوعد بدعم
    // رقم الهاتف اللي لسه مش موجود).
    this.auth.login(this.emailOrPhone, this.password).subscribe({
      next: (response: any) => {
        this.toastIcon = '✓';
        this.toastTitle = 'تم تسجيل الدخول';
        this.toastMessage = response.message;
        this.showSuccessMessage = true;

        this.cdr.detectChanges();

        const role = response?.data?.user?.role;

        setTimeout(() => {
          this.showSuccessMessage = false;

          if (role === 'artisan') {
            this.router.navigate(['/craftsman-dashboard']);
          } else {
            this.router.navigate(['/customer-dashboard']);
          }
        }, 1500);
      },

      error: (error) => {
        this.toastIcon = '✕';
        this.toastTitle = 'تعذر تسجيل الدخول';
        this.toastMessage = error?.error?.message || 'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.';
        this.showSuccessMessage = true;

        this.cdr.detectChanges();

        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 3000);
      },
    });
  }
}
