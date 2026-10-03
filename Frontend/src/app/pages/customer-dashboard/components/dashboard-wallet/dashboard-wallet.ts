import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../../../services/marketplace';
interface PaymentMethod { id: string; type: string; lastFour: string; icon: string; details: string; }
interface WalletTransaction { id: string; title: string; date: string; type: string; amount: number; status: string; }

@Component({
  selector: 'app-dashboard-wallet', imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-wallet.html', styleUrl: './dashboard-wallet.css',
})
export class DashboardWallet implements OnInit {
  constructor(private api: Marketplace, private cdr: ChangeDetectorRef) {}
  walletLoading = false;
  walletError = '';
  availableBalance = 0;
  escrowBalance = 0;
  paymentMethods: PaymentMethod[] = [];
  transactions: WalletTransaction[] = [];
  activeTab = 'all';
  depositModalOpen = false;
  withdrawModalOpen = false;
  paymentModalOpen = false;
  transactionAmount: number | null = null;
  selectedPaymentMethodId: string | null = null;
  paymentType = 'card';
  cardNumber = '';
  cardHolder = '';
  expiryDate = '';
  cvv = '';
  walletNumber = '';
  modalError = '';
  saving = false;
  ngOnInit() {
    this.loadWallet();
    this.api.settings().subscribe({
      next: res => {
        this.paymentMethods = (res.data.paymentMethods || []).map((p: any) => ({
          id: p.id, type: p.type, lastFour: p.lastFour, icon: p.icon, details: p.details
        }));
        this.cdr.markForCheck();
      },
      error: () => { this.walletError = 'تعذر تحميل طرق الدفع.'; this.cdr.markForCheck(); }
    });
  }
  loadWallet() {
    this.walletLoading = true; this.walletError = '';
    this.api.wallet().subscribe({
      next: res => {
        this.availableBalance = res.data.availableBalance; this.escrowBalance = res.data.escrowBalance;
        this.transactions = (res.data.transactions || []).map((t: any) => ({
          id: t._id, title: t.title, date: new Date(t.createdAt).toLocaleString('ar-EG'), type: t.type,
          amount: t.meta?.direction === 'debit' || ['withdraw','payment','escrow_hold'].includes(t.type) ? -t.amount : t.amount,
          status: t.status === 'completed' ? 'مكتمل' : t.status === 'pending' ? 'قيد الانتظار' : 'فشل'
        }));
        this.walletLoading = false; this.cdr.markForCheck();
      },
      error: () => { this.walletLoading = false; this.walletError = 'تعذر تحميل المحفظة.'; this.cdr.markForCheck(); }
    });
  }
  get filteredTransactions() {
    return this.activeTab === 'all' ? this.transactions : this.transactions.filter(t =>
      this.activeTab === 'escrow' ? t.type.startsWith('escrow_') : t.type === this.activeTab);
  }
  changeTab(tab: string) { this.activeTab = tab; }
  openDepositModal() { this.resetModal(); this.depositModalOpen = true; this.selectedPaymentMethodId = this.paymentMethods[0]?.id ?? null; }
  openWithdrawModal() { this.resetModal(); this.withdrawModalOpen = true; this.selectedPaymentMethodId = this.paymentMethods[0]?.id ?? null; }
  openPaymentModal() { this.resetModal(); this.paymentModalOpen = true; this.paymentType = 'card'; }
  closeModals() {
    if (this.saving) return;
    this.depositModalOpen = false; this.withdrawModalOpen = false; this.paymentModalOpen = false; this.resetModal();
  }
  confirmDeposit() { this.submitTransaction(false); }
  confirmWithdraw() { this.submitTransaction(true); }
  private submitTransaction(withdraw: boolean) {
    const amount = Number(this.transactionAmount);
    if (!Number.isFinite(amount) || amount <= 0 || this.saving) { this.modalError = 'أدخل مبلغًا صحيحًا.'; return; }
    this.saving = true; this.modalError = '';
    (withdraw ? this.api.withdraw(amount) : this.api.deposit(amount)).subscribe({
      next: () => { this.saving = false; this.closeModals(); this.loadWallet(); },
      error: err => { this.saving = false; this.modalError = err.error?.message || 'تعذر تنفيذ العملية.'; this.cdr.markForCheck(); }
    });
  }
  savePaymentMethod() {
    if (this.saving) return;
    const digits = (this.paymentType === 'card' ? this.cardNumber : this.walletNumber).replace(/\D/g, '');
    if (this.paymentType === 'card' ? digits.length !== 4 : !/^01[0125][0-9]{8}$/.test(digits)) {
      this.modalError = this.paymentType === 'card' ? 'أدخل آخر 4 أرقام فقط.' : 'أدخل رقم محفظة صحيحًا.'; return;
    }
    const type = this.paymentType === 'card' ? 'بطاقة' : 'محفظة إلكترونية';
    const method: PaymentMethod = { id: crypto.randomUUID(), type, lastFour: digits.slice(-4),
      icon: this.paymentType === 'card' ? 'bi-credit-card' : 'bi-phone', details: type + ' •••• ' + digits.slice(-4) };
    const paymentMethods = [...this.paymentMethods, method];
    this.saving = true;
    this.api.saveSettings({ paymentMethods }).subscribe({
      next: () => { this.paymentMethods = paymentMethods; this.saving = false; this.closeModals(); this.cdr.markForCheck(); },
      error: err => { this.saving = false; this.modalError = err.error?.message || 'تعذر حفظ طريقة الدفع.'; this.cdr.markForCheck(); }
    });
  }
  resetModal() {
    this.transactionAmount = null; this.selectedPaymentMethodId = null; this.modalError = '';
    this.cardNumber = ''; this.cardHolder = ''; this.expiryDate = ''; this.cvv = ''; this.walletNumber = '';
  }
  exportStatement() {
    const rows = [['رقم العملية','الوصف','التاريخ','المبلغ','الحالة'], ...this.filteredTransactions.map(t => [t.id,t.title,t.date,t.amount,t.status])];
    const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'wallet-statement.csv'; link.click(); URL.revokeObjectURL(url);
  }
}
