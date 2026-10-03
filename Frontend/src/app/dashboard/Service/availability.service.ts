import { Injectable, signal } from '@angular/core';
import { Auth } from '../../services/auth';
import { Marketplace } from '../../services/marketplace';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {

  private _isAvailable = signal(false);
  readonly error = signal('');
  private saving = false;

  constructor(private api: Marketplace, auth: Auth) {
    auth.currentUser$.subscribe(user => {
      this._isAvailable.set(user?.artisan?.isAvailable ?? false);
      if (user?.role === 'artisan' && !user.artisan) {
        this.api.artisanProfile().subscribe({ next: res => this._isAvailable.set(res.data.isAvailable),
          error: () => this.error.set('تعذر تحميل حالة التوفر.') });
      }
    });
  }

  readonly isAvailable = this._isAvailable.asReadonly();

  set(value: boolean) {
    if (this.saving) return;
    this.saving = true;
    this.api.updateArtisanProfile({ isAvailable: value }).subscribe({
      next: () => { this._isAvailable.set(value); this.saving = false; this.error.set(''); },
      error: () => { this.saving = false; this.error.set('تعذر حفظ حالة التوفر.'); },
    });
  }

  toggle() {
    this.set(!this._isAvailable());
  }
}
