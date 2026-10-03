import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/api.config';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: '../login/login.css',
})
export class ResetPassword implements OnInit {
  token = '';
  newPassword = '';
  loading = false;
  error = '';
  done = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  submit(): void {
    if (!this.token) {
      this.error = 'رابط إعادة التعيين غير صالح.';
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(this.newPassword)) {
      this.error = 'كلمة المرور لازم 8 حروف على الأقل وفيها حرف كبير وصغير ورقم ورمز.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.http
      .post<any>(`${API_BASE_URL}/auth/reset-password`, { token: this.token, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.loading = false;
          this.done = true;
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'الرابط منتهي أو غير صالح.';
          this.cdr.markForCheck();
        },
      });
  }
}
