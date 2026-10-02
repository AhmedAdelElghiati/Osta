import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';

@Component({
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  selector: 'app-client-register',
  styleUrl: './client-register.css',
  templateUrl: './client-register.html',
})
export class ClientRegister {
  showPassword = false;
  showConfirmPassword = false;

  fullName = '';
  email = '';
  phone = '';
  coverageArea = '';
  city = '';

  password = '';
  confirmPassword = '';

  termsAccepted = false;

  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  showSuccessMessage = false;
  toastTitle = '';
  toastMessage = '';
  toastIcon = '';

  constructor(
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkPasswordStrength(): void {
    const password = this.password;

    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';

      return;
    }

    let score = 0;

    // At least 8 characters
    if (password.length >= 8) {
      score++;
    }

    // Uppercase
    if (/[A-Z]/.test(password)) {
      score++;
    }

    // Lowercase
    if (/[a-z]/.test(password)) {
      score++;
    }

    // Number
    if (/[0-9]/.test(password)) {
      score++;
    }

    // Special character
    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    }

    if (score <= 2) {
      this.passwordStrength = 35;
      this.passwordStrengthText = 'كلمة مرور ضعيفة';
      this.passwordStrengthClass = 'weak';
    } else if (score <= 4) {
      this.passwordStrength = 70;
      this.passwordStrengthText = 'كلمة مرور متوسطة';
      this.passwordStrengthClass = 'medium';
    } else {
      this.passwordStrength = 100;
      this.passwordStrengthText = 'كلمة مرور قوية';
      this.passwordStrengthClass = 'strong';
    }
  }

  get passwordsMatch(): boolean {
    return (
      this.password.length > 0 &&
      this.confirmPassword.length > 0 &&
      this.password === this.confirmPassword
    );
  }

  onRegister(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.password !== this.confirmPassword) {
      return;
    }

    if (this.passwordStrengthClass !== 'strong') {
      return;
    }

    if (!this.termsAccepted) {
      return;
    }

    const userData = {
      name: this.fullName,
      email: this.email,
      phone: this.phone,
      password: this.password,
      role: 'customer',
      location: this.city,
    };

    this.auth.register(userData).subscribe({
      next: (response: any) => {
        console.log('1 - response وصل:', response);

        this.toastIcon = '✓';
        this.toastTitle = 'تم التسجيل بنجاح';
        this.toastMessage = response.message;
        this.showSuccessMessage = true;

        this.cdr.detectChanges();

        console.log('2 - message:', this.toastMessage);
        console.log('3 - toast ظهر');

        setTimeout(() => {
          this.showSuccessMessage = false;

          form.resetForm();

          this.fullName = '';
          this.email = '';
          this.phone = '';
          this.coverageArea = '';
          this.city = '';

          this.password = '';
          this.confirmPassword = '';

          this.termsAccepted = false;

          this.passwordStrength = 0;
          this.passwordStrengthText = '';
          this.passwordStrengthClass = '';

          this.showPassword = false;
          this.showConfirmPassword = false;
        }, 3000);
      },

      error: (error) => {
        console.log('1 - error وصل:', error);

        this.toastIcon = '✕';
        this.toastTitle = 'تعذر التسجيل';
        this.toastMessage = error.error.message;
        this.showSuccessMessage = true;

        this.cdr.detectChanges();

        console.log('2 - message:', this.toastMessage);
        console.log('3 - toast ظهر');
      },
    });
  }
}
