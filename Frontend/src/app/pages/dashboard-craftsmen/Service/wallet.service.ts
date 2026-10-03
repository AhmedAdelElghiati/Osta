import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WALLET_ENDPOINT } from '../../../core/api.config';

export interface Tx {
  type: 'escrow' | 'income' | 'fee' | 'withdraw';
  title: string;
  sub: string;
  date: string;
  status: string;
  amount: number;
  green?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WalletService {

  constructor(private http: HttpClient) {
    this.load();
  }

  readonly COMMISSION = 0.03;

  balance = 0;
  escrow = 0;
    /** حساب السحب المحفوظ من صفحة الإعدادات */
  payout = { provider: 'فودافون كاش', number: '0100 987 6543' };

  get payoutLabel() {
    const last2 = this.payout.number.replace(/\D/g, '').slice(-2);
    return `${this.payout.provider} •• ${last2}`;
  }

  private feeSeq = 92;

  transactions: Tx[] = [];
  load(): void {
    this.http.get<any>(WALLET_ENDPOINT, { withCredentials: true }).subscribe({
      next: (response) => {
        const data = response?.data;
        this.balance = Number(data?.availableBalance ?? 0);
        this.escrow = Number(data?.escrowBalance ?? 0);
        this.transactions = (data?.transactions ?? []).map((transaction: any) => this.mapTransaction(transaction));
      },
    });
  }

  private mapTransaction(transaction: any): Tx {
    const type: Tx['type'] = transaction.type === 'escrow_hold'
      ? 'escrow'
      : transaction.type === 'escrow_release' || transaction.type === 'deposit' || transaction.type === 'refund'
        ? 'income'
        : transaction.type === 'withdraw'
          ? 'withdraw'
          : 'fee';
    return {
      type,
      title: transaction.title || 'عملية مالية',
      sub: transaction.meta?.jobId ? `#${String(transaction.meta.jobId).slice(-6).toUpperCase()}` : '',
      date: transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('ar-EG') : '',
      status: transaction.status === 'completed' ? 'مكتمل' : transaction.status,
      amount: Number(transaction.amount || 0),
      green: type === 'income',
    };
  }

  get earnings() {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /** عميل قبل العرض → المبلغ يتحجز في الضمان */
  reserveEscrow(title: string, amount: number) {
    this.escrow += amount;
    this.transactions.unshift({
      type: 'escrow',
      title: 'حجز ضمان من العميل',
      sub: `${title} — #ESC-${2200 + Math.floor(Math.random() * 60)}`,
      date: 'الآن',
      status: 'محجوز',
      amount
    });
  }

  /** العميل اعتمد التسليم → تحرير الضمان للرصيد بعد خصم العمولة */
  release(title: string, price: number, inv: string) {
    const fee = Math.round(price * this.COMMISSION);
    const net = price - fee;

    this.escrow = Math.max(0, this.escrow - price);
    this.balance += net;

    this.transactions.unshift({
      type: 'income', title: 'تحرير ضمان — أرباح شغلانة',
      sub: `${title} — #${inv}`, date: 'الآن', status: 'مكتمل', amount: net, green: true
    });
    this.transactions.unshift({
      type: 'fee', title: 'عمولة المنصة (3%)',
      sub: `${title} — #FEE-0${this.feeSeq++}`, date: 'الآن', status: 'مدفوع', amount: fee
    });

    return { net, fee };
  }
  /** سحب أرباح — POST /api/v1/wallet/withdraw، والـ callback بيرجع رسالة خطأ أو null */
  withdraw(amount: number, to: string, done: (error: string | null) => void): void {
    if (!amount || amount <= 0) return done('اكتب مبلغ صحيح أول');
    if (amount > this.balance) return done('المبلغ أكبر من رصيدك المتاح');

    this.http.post<any>(`${WALLET_ENDPOINT}/withdraw`, { amount }, { withCredentials: true }).subscribe({
      next: () => {
        this.load();
        done(null);
      },
      error: (error) => done(error?.error?.message || 'تعذر تنفيذ السحب دلوقتي، حاول تاني.'),
    });
  }
}