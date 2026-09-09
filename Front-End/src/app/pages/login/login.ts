import { Component } from '@angular/core';
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

    console.log('Login submitted:', {
      type: this.activeTab,

      identifier: this.emailOrPhone,

      remember: this.rememberMe,
    });

    // Show success message
    this.showSuccessMessage = true;

    // Reset everything after 5 seconds
    setTimeout(() => {
      form.resetForm();

      this.emailOrPhone = '';
      this.password = '';

      this.rememberMe = false;

      this.showPassword = false;

      this.showSuccessMessage = false;
    }, 5000);
  }
}
