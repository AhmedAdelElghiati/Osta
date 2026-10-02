import { Component, ChangeDetectorRef } from '@angular/core';
import { Auth } from '../../services/auth';
import { RouterModule } from '@angular/router';
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

    this.auth.login(this.emailOrPhone, this.password).subscribe({
      next: (response: any) => {
        console.log('1 - response وصل:', response);

        this.toastIcon = '✓';
        this.toastTitle = 'تم تسجيل الدخول';
        this.toastMessage = response.message;
        this.showSuccessMessage = true;

        this.cdr.detectChanges();

        console.log('2 - message:', this.toastMessage);
        console.log('3 - toast ظهر');

        setTimeout(() => {
          this.showSuccessMessage = false;

          form.resetForm();

          this.emailOrPhone = '';
          this.password = '';
          this.rememberMe = false;
          this.showPassword = false;
        }, 3000);
      },

      error: (error) => {
        console.log('1 - error وصل:', error);

        this.toastIcon = '✕';
        this.toastTitle = 'تعذر تسجيل الدخول';
        this.toastMessage = error.error.message;
        this.showSuccessMessage = true;

        this.cdr.detectChanges();

        console.log('2 - message:', this.toastMessage);
        console.log('3 - toast ظهر');
      },
    });
  }
}
