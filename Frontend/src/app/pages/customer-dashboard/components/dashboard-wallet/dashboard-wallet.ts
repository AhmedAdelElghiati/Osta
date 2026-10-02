import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../../../services/marketplace';
@Component({
  selector: 'app-dashboard-wallet',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-wallet.html',
  styleUrl: './dashboard-wallet.css',
})
export class DashboardWallet implements OnInit {
  constructor(private api: Marketplace, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadWallet();
  }

  // Wallet Summary — GET /api/v1/wallet
  walletLoading = false;
  walletError = '';

  loadWallet(): void {
    this.walletLoading = true;
    this.api.wallet().subscribe({
      next: (res: any) => {
        const data = res?.data;
        if (data) {
          this.availableBalance = data.availableBalance ?? 0;
          this.escrowBalance = data.escrowBalance ?? 0;
          const txs = (data.transactions ?? []).map((t: any) => ({
            id: String(t._id).slice(-6).toUpperCase(),
            title: t.title,
            date: t.createdAt,
            type: t.type,
            amount: ['withdraw', 'payment'].includes(t.type) ? -Math.abs(t.amount) : Math.abs(t.amount),
            status: t.status,
          }));
          if (txs.length) this.transactions = txs;
        }
        this.walletLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.walletLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Wallet Summary
  availableBalance = 0;
  escrowBalance = 0;
  // Payment Methods
  paymentMethods = [
    {
      id: 1,
      type: 'Visa',
      lastFour: '4242',
      icon: 'bi-credit-card',
      details: 'Visa •••• 4242',
    },
    {
      id: 2,
      type: 'Vodafone Cash',
      lastFour: '7',
      icon: 'bi-phone',
      details: 'Vodafone Cash •••• 7',
    },
  ];

  // Transactions

  transactions = [
    {
      id: 'TRX-1025',
      title: 'حجز ضمان - تجديد مطبخ أرو أمريكي',
      date: '24 مايو 2026',
      type: 'escrow',
      amount: -4850,
      status: 'محجوز',
    },
    {
      id: 'TRX-1024',
      title: 'دفع مقدم - صيانة سباكة ومحابس الحمام',
      date: '23 مايو 2026',
      type: 'payment',
      amount: -1400,
      status: 'مدفوع',
    },
    {
      id: 'TRX-1023',
      title: 'إيداع في المحفظة',
      date: '22 مايو 2026',
      type: 'deposit',
      amount: 5000,
      status: 'مكتمل',
    },
    {
      id: 'TRX-1022',
      title: 'استرداد مبلغ',
      date: '20 مايو 2026',
      type: 'refund',
      amount: 1200,
      status: 'مسترد',
    },
  ];

  // Transactions Tab

  activeTab = 'all';

  // Modals

  depositModalOpen = false;

  withdrawModalOpen = false;

  paymentModalOpen = false;

  // Modal Data

  transactionAmount: number | null = null;

  selectedPaymentMethodId: number | null = null;

  paymentType = 'card';

  // Form Data

  cardNumber = '';

  cardHolder = '';

  expiryDate = '';

  cvv = '';

  walletNumber = '';

  // Error Message

  modalError = '';

  // Filter Transactions

  get filteredTransactions() {
    if (this.activeTab === 'all') {
      return this.transactions;
    }

    return this.transactions.filter((transaction) => transaction.type === this.activeTab);
  }

  // Change Tab

  changeTab(tab: string) {
    this.activeTab = tab;
  }

  // Open Deposit Modal

  openDepositModal() {
    this.resetModal();

    this.depositModalOpen = true;

    this.selectedPaymentMethodId = this.paymentMethods[0]?.id ?? null;
  }

  // Open Withdraw Modal

  openWithdrawModal() {
    this.resetModal();

    this.withdrawModalOpen = true;

    this.selectedPaymentMethodId = this.paymentMethods[0]?.id ?? null;
  }

  // Open Add Payment Modal

  openPaymentModal() {
    this.resetModal();

    this.paymentModalOpen = true;

    this.paymentType = 'card';
  }

  // Close Modals

  closeModals() {
    this.depositModalOpen = false;

    this.withdrawModalOpen = false;

    this.paymentModalOpen = false;

    this.resetModal();
  }

  // Deposit — POST /api/v1/wallet/deposit
  confirmDeposit() {
    this.modalError = '';

    const amount = Number(this.transactionAmount);

    if (!amount || amount <= 0) {
      this.modalError = 'من فضلك أدخل مبلغًا صحيحًا.';

      return;
    }

    if (!this.selectedPaymentMethodId) {
      this.modalError = 'من فضلك اختر طريقة الدفع.';

      return;
    }

    this.api.deposit(amount).subscribe({
      next: () => {
        this.closeModals();
        this.loadWallet();
      },
      error: (err) => (this.modalError = err?.error?.message || 'تعذر تنفيذ الإيداع.'),
    });
  }

  // Withdraw — POST /api/v1/wallet/withdraw
  confirmWithdraw() {
    this.modalError = '';

    const amount = Number(this.transactionAmount);

    if (!amount || amount <= 0) {
      this.modalError = 'من فضلك أدخل مبلغًا صحيحًا.';

      return;
    }

    if (!this.selectedPaymentMethodId) {
      this.modalError = 'من فضلك اختر طريقة الاستلام.';

      return;
    }

    if (amount > this.availableBalance) {
      this.modalError = 'المبلغ المطلوب أكبر من الرصيد المتاح.';

      return;
    }

    this.api.withdraw(amount).subscribe({
      next: () => {
        this.closeModals();
        this.loadWallet();
      },
      error: (err) => (this.modalError = err?.error?.message || 'تعذر تنفيذ السحب.'),
    });

    this.closeModals();
  }

  // Add Payment Method

  savePaymentMethod() {
    this.modalError = '';

    if (this.paymentType === 'card') {
      if (!this.cardNumber || !this.cardHolder || !this.expiryDate || !this.cvv) {
        this.modalError = 'من فضلك أكمل بيانات البطاقة.';

        return;
      }

      const cleanCardNumber = this.cardNumber.replace(/\s/g, '');

      if (cleanCardNumber.length < 16) {
        this.modalError = 'رقم البطاقة يجب أن يكون صحيحًا.';

        return;
      }

      this.paymentMethods.push({
        id: Date.now(),

        type: 'Visa',

        lastFour: cleanCardNumber.slice(-4),

        icon: 'bi-credit-card',

        details: `Visa •••• ${cleanCardNumber.slice(-4)}`,
      });
    } else {
      if (!this.walletNumber) {
        this.modalError = 'من فضلك أدخل رقم المحفظة.';

        return;
      }

      if (this.walletNumber.length < 11) {
        this.modalError = 'رقم المحفظة يجب أن يكون صحيحًا.';

        return;
      }

      this.paymentMethods.push({
        id: Date.now(),

        type: 'Vodafone Cash',

        lastFour: this.walletNumber.slice(-1),

        icon: 'bi-phone',

        details: `Vodafone Cash •••• ${this.walletNumber.slice(-1)}`,
      });
    }

    this.closeModals();
  }

  // Reset Modal

  resetModal() {
    this.transactionAmount = null;

    this.selectedPaymentMethodId = null;

    this.modalError = '';

    this.cardNumber = '';

    this.cardHolder = '';

    this.expiryDate = '';

    this.cvv = '';

    this.walletNumber = '';
  }

  // Export Statement

  exportStatement() {
    const headers = ['رقم العملية', 'الوصف', 'التاريخ', 'المبلغ', 'الحالة'];
    const rows = this.filteredTransactions.map((transaction) => [
      transaction.id,
      transaction.title,
      transaction.date,
      transaction.amount,
      transaction.status,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wallet-statement.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
