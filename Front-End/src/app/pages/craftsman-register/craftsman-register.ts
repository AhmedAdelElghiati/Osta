import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  selector: 'app-craftsman-register',
  styleUrl: './craftsman-register.css',
  templateUrl: './craftsman-register.html',
})
export class CraftsmanRegister {

  showPassword = false;
  showConfirmPassword = false;

  fullName = '';
  experience = '';
  specialty = '';
  whatsapp = '';
  phone = '';
  coverageArea = '';
  city = '';
  email = '';
  password = '';
  confirmPassword = '';
  termsAccepted = false;

  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  showSuccessMessage = false;

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

    // Uppercase letter
    if (/[A-Z]/.test(password)) {
      score++;
    }

    // Lowercase letter
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

    console.log('Craftsman registered', {
      fullName: this.fullName,
      experience: this.experience,
      specialty: this.specialty,
      whatsapp: this.whatsapp,
      phone: this.phone,
      coverageArea: this.coverageArea,
      city: this.city,
      email: this.email,
      password: this.password
    });

    // Show success message
    this.showSuccessMessage = true;

    // Clear form after 5 seconds
    setTimeout(() => {

      form.resetForm();

      this.fullName = '';
      this.experience = '';
      this.specialty = '';
      this.whatsapp = '';
      this.phone = '';
      this.coverageArea = '';
      this.city = '';
      this.email = '';
      this.password = '';
      this.confirmPassword = '';
      this.termsAccepted = false;

      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';

      this.showPassword = false;
      this.showConfirmPassword = false;

      this.showSuccessMessage = false;

    }, 5000);
  }
}