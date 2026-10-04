import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  private auth = inject(Auth);
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.currentUserValue });
  loggingOut = false;
  logoutError = '';
  get dashboardLink(): string {
    return this.user()?.role === 'admin' ? '/admin-dashboard' : this.user()?.role === 'artisan' ? '/dashboard/home' : '/customer-dashboard';
  }
  logout(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.logoutError = '';
    this.auth.logout().subscribe({
      next: () => { this.loggingOut = false; },
      error: () => { this.loggingOut = false; this.logoutError = 'تعذر تسجيل الخروج. حاول مرة أخرى.'; },
    });
  }
}

