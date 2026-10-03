import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Tx, WalletService } from '../Service/wallet.service';

type TabKey = 'all' | 'income' | 'escrow' | 'fee' | 'withdraw';

@Component({
  selector: 'app-dashboard-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './earnings.html',
  styleUrl: './earnings.css'
})
export class Earnings {

  private wallet = inject(WalletService);
  private router = inject(Router);

  activeTab: TabKey = 'all';

  tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'كل الحركات' },
    { key: 'income', label: 'أرباح' },
    { key: 'escrow', label: 'ضمان' },
    { key: 'fee', label: 'عمولات' },
    { key: 'withdraw', label: 'سحوبات' }
  ];

  statusClass: Record<string, string> = {
    'محجوز': 'st-held',
    'مدفوع': 'st-paid',
    'مكتمل': 'st-done',
    'مسترد': 'st-refund'
  };

  get methods() {
    return [this.wallet.payoutLabel];
  }

  withdrawTo = '';
  withdrawOpen = false;
  withdrawAmount: number | null = null;
 

  toast = '';
  private toastTimer: any;

  get balance() {
    return this.wallet.balance;
  }

  get escrow() {
    return this.wallet.escrow;
  }

  get transactions(): Tx[] {
    return this.wallet.transactions.filter(
      t => this.activeTab === 'all' || t.type === this.activeTab
    );
  }

  /* ========== السحب ========== */

  withdraw() {
    this.withdrawAmount = null;
    this.withdrawTo = this.methods[0];
    this.withdrawOpen = true;
  }

  closeWithdraw() {
    this.withdrawOpen = false;
  }

  confirmWithdraw() {
    const amount = Number(this.withdrawAmount);
    this.wallet.withdraw(amount, this.withdrawTo, (error) => {
      if (error) {
        this.showToast(error);
        return;
      }

      this.withdrawOpen = false;
      this.showToast(`تم طلب سحب ${this.fmt(amount)} ج.م — هيوصل على محفظتك خلال 24 ساعة`);
    });
  }

  /* ========== التصدير ========== */

  exportStatement() {
    const rows: (string | number)[][] = [['العملية', 'التفاصيل', 'التاريخ', 'الحالة', 'المبلغ (ج.م)']];

    [...this.wallet.transactions]
      .reverse()
      .forEach(t => rows.push([t.title, t.sub, t.date, t.status, t.amount]));

    const csv =
      '\uFEFF' +
      rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'ossta-craftsman-statement.csv';
    a.click();
    URL.revokeObjectURL(a.href);

    this.showToast('تم تنزيل كشف الحساب بصيغة CSV');
  }

  openJobs() {
    this.router.navigate(['/dashboard/my-jobs']);
  }

  showToast(message: string) {
    this.toast = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 3500);
  }

  fmt(n: number) {
    return n.toLocaleString('en-US');
  }
}