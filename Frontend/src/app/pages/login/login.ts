import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

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
    private cdr: ChangeDetectorRef,
    private router: Router,
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

    const identifier = this.emailOrPhone.trim();
    if (!/^\S+@\S+\.\S+$/.test(identifier)) {
      this.toastIcon = '✕';
      this.toastTitle = 'تعذر تسجيل الدخول';
      this.toastMessage = 'اكتب البريد الإلكتروني المسجل بيه (تسجيل الدخول بالبريد).';
      this.showSuccessMessage = true;
      this.cdr.detectChanges();
      return;
    }

    this.auth.login(identifier, this.password).subscribe({
      next: (response: any) => {
        this.toastIcon = '✓';
        this.toastTitle = 'تم تسجيل الدخول';
        this.toastMessage = response?.message || 'أهلًا بيك في أُسطى';
        this.showSuccessMessage = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          const role = this.auth.currentUserValue?.role ?? response?.data?.user?.role;
          const target =
            role === 'artisan'
              ? '/dashboard/home'
              : role === 'admin'
                ? '/admin-dashboard'
                : '/customer-dashboard';

          this.showSuccessMessage = false;
          form.resetForm();
          this.emailOrPhone = '';
          this.password = '';
          this.rememberMe = false;
          this.showPassword = false;

          void this.router.navigateByUrl(target);
        }, 700);
      },
      error: (error) => {
        this.toastIcon = '✕';
        this.toastTitle = 'تعذر تسجيل الدخول';
        this.toastMessage = error?.error?.message || 'راجع بيانات الدخول وحاول تاني.';
        this.showSuccessMessage = true;
        this.cdr.detectChanges();
      },
    });
  }
}
