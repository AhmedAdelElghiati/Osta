import { Injectable } from '@angular/core';

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

  readonly COMMISSION = 0.03;

  balance = 6420;
  escrow = 3250;
    /** حساب السحب المحفوظ من صفحة الإعدادات */
  payout = { provider: 'فودافون كاش', number: '0100 987 6543' };

  get payoutLabel() {
    const last2 = this.payout.number.replace(/\D/g, '').slice(-2);
    return `${this.payout.provider} •• ${last2}`;
  }

  private feeSeq = 92;

  transactions: Tx[] = [
    { type: 'escrow', title: 'حجز ضمان من العميل', sub: 'صيانة سباكة ومحابس الحمام — #ESC-2229', date: '22 مايو', status: 'محجوز', amount: 1400 },
    { type: 'escrow', title: 'حجز ضمان من العميل', sub: 'تركيب سخانات شقة كاملة — #ESC-2241', date: '24 مايو', status: 'محجوز', amount: 1850 },
    { type: 'income', title: 'تحرير ضمان — أرباح شغلانة', sub: 'تأسيس شبكة مياه — فيلا التجمع — #INV-0998', date: '12 مايو', status: 'مكتمل', amount: 8148, green: true },
    { type: 'fee', title: 'عمولة المنصة (3%)', sub: 'تأسيس شبكة مياه — فيلا التجمع — #FEE-0090', date: '12 مايو', status: 'مدفوع', amount: 252 },
    { type: 'income', title: 'تحرير ضمان — أرباح شغلانة', sub: 'إصلاح تسريب مطبخ — #INV-0971', date: '5 مايو', status: 'مكتمل', amount: 1116, green: true },
    { type: 'fee', title: 'عمولة المنصة (3%)', sub: 'إصلاح تسريب مطبخ — #FEE-0081', date: '5 مايو', status: 'مدفوع', amount: 34 },
    { type: 'withdraw', title: 'سحب أرباح', sub: 'فودافون كاش •• 43 — #WDR-289', date: '1 مايو', status: 'مكتمل', amount: 5000 }
  ];

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
    /** سحب أرباح — بيرجع رسالة خطأ لو المبلغ مش صحيح */
  withdraw(amount: number, to: string): string | null {
    if (!amount || amount <= 0) return 'اكتب مبلغ صحيح أول';
    if (amount > this.balance) return 'المبلغ أكبر من رصيدك المتاح';

    this.balance -= amount;
    this.transactions.unshift({
      type: 'withdraw',
      title: 'سحب أرباح',
      sub: `${to} — #WDR-${290 + Math.floor(Math.random() * 50)}`,
      date: 'الآن',
      status: 'مكتمل',
      amount
    });
    return null;
  }
}