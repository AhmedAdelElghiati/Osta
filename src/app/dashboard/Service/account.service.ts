import { Injectable } from '@angular/core';

export interface Account {
  name: string;
  email: string;
  phone: string;
  city: string;
}

export interface NotifyPrefs {
  newRequests: boolean;
  offerUpdates: boolean;
  messages: boolean;
  escrow: boolean;
}

@Injectable({ providedIn: 'root' })
export class AccountService {

  account: Account = {
    name: 'الأسطى إبراهيم صقر',
    email: 'ibrahim@ossta.com',
    phone: '0100 987 6543',
    city: 'طنطا'
  };

  prefs: NotifyPrefs = {
    newRequests: true,
    offerUpdates: true,
    messages: true,
    escrow: true
  };
}