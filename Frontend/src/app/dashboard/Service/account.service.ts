import { Injectable, signal } from '@angular/core';
import { Auth } from '../../services/auth';

export interface Account {
  name: string;
  email: string;
  phone: string;
  city: string;
  rating?: number;
  profession?: string;
}

export interface NotifyPrefs {
  newRequests: boolean;
  offerUpdates: boolean;
  messages: boolean;
  escrow: boolean;
}

@Injectable({ providedIn: 'root' })
export class AccountService {

  constructor(auth: Auth) {
    auth.currentUser$.subscribe((user) => {
      if (!user) { this.account = { name: '', email: '', phone: '', city: '', rating: 0 }; return; }
      this.account = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.location || '',
        rating: Number(user.artisan?.rating ?? 0),
        profession: user.artisan?.profession || '',
      };
    });
  }

  private accountState = signal<Account>({
    name: '',
    email: '',
    phone: '',
    city: '',
    rating: 0,
  });
  get account() { return this.accountState(); }
  set account(value: Account) { this.accountState.set(value); }

  prefs: NotifyPrefs = {
    newRequests: true,
    offerUpdates: true,
    messages: true,
    escrow: true
  };
}
