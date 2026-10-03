import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { WALLET_ENDPOINT } from '../../core/api.config';
import { Marketplace } from '../../services/marketplace';
import { Auth } from '../../services/auth';

export interface Tx {
  type: 'escrow' | 'income' | 'fee' | 'withdraw';
  title: string; sub: string; date: string; status: string; amount: number; green?: boolean; createdAt?: string;
}
@Injectable({ providedIn: 'root' })
export class WalletService {
  private balanceState = signal(0);
  get balance() { return this.balanceState(); }
  set balance(value: number) { this.balanceState.set(value); }
  private escrowState = signal(0);
  get escrow() { return this.escrowState(); }
  set escrow(value: number) { this.escrowState.set(value); }
  private payoutState = signal({ provider: '', number: '' });
  get payout() { return this.payoutState(); }
  set payout(value: { provider: string; number: string }) { this.payoutState.set(value); }
  private transactionState = signal<Tx[]>([]);
  get transactions() { return this.transactionState(); }
  set transactions(value: Tx[]) { this.transactionState.set(value); }
  error = '';
  constructor(private http: HttpClient, private api: Marketplace, auth: Auth) {
    auth.currentUser$.subscribe(user => {
      this.balance = 0; this.escrow = 0; this.transactions = []; this.payout = { provider: '', number: '' };
      if (user?.role === 'artisan') {
        this.load();
        this.api.settings().subscribe({ next: res => { this.payout = res.data.payout || this.payout; },
          error: () => { this.error = 'تعذر تحميل حساب السحب.'; } });
      }
    });
  }
  get payoutLabel() {
    return this.payout.provider ? this.payout.provider + ' •• ' + this.payout.number.slice(-2) : '';
  }
  load() {
    this.http.get<any>(WALLET_ENDPOINT, { withCredentials: true }).subscribe({
      next: res => {
        this.balance = res.data.availableBalance; this.escrow = res.data.escrowBalance;
        this.transactions = (res.data.transactions || []).map((t: any) => ({
          type: t.type === 'escrow_hold' ? 'escrow' : ['escrow_release','deposit','refund'].includes(t.type) ? 'income' : t.type === 'withdraw' ? 'withdraw' : 'fee',
          title: t.title, sub: t.meta?.jobId ? '#' + t.meta.jobId.slice(-6) : '',
          date: new Date(t.createdAt).toLocaleDateString('ar-EG'), createdAt: t.createdAt,
          status: t.status === 'completed' ? 'مكتمل' : t.status === 'pending' ? 'قيد الانتظار' : 'فشل',
          amount: t.amount, green: ['escrow_release','deposit','refund'].includes(t.type)
        }));
        this.error = '';
      },
      error: () => { this.error = 'تعذر تحميل المحفظة.'; }
    });
  }
  get earnings() {
    const today = new Date();
    return this.transactions.filter(t => {
      const date = new Date(t.createdAt || '');
      return t.type === 'income' && t.status === 'مكتمل' && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }).reduce((sum, t) => sum + t.amount, 0);
  }
  withdraw(amount: number, _to: string): Observable<any> {
    return this.api.withdraw(amount).pipe(tap(() => this.load()));
  }
}
