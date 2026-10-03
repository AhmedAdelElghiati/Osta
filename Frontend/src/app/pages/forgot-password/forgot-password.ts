import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/api.config';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: '../login/login.css',
})
export class ForgotPassword {
  email = '';
  loading = false;
  done = false;
  error = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  submit(): void {
    const email = this.email.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.error = 'اكتب بريد إلكتروني صحيح.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.http.post<any>(`${API_BASE_URL}/auth/forgot-password`, { email }).subscribe({
      next: () => {
        this.loading = false;
        this.done = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'تعذر إرسال الطلب، حاول تاني.';
        this.cdr.markForCheck();
      },
    });
  }
}
