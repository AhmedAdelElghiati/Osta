import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Marketplace } from '../../../../services/marketplace';
import { Auth } from '../../../../services/auth';

@Component({
  selector: 'app-dashboard-support',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-support.html',
  styleUrl: './dashboard-support.css',
})
export class DashboardSupport implements OnInit {
  constructor(
    private cdr: ChangeDetectorRef,
    private marketplace: Marketplace,
    private auth: Auth,
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  // التذاكر الحقيقية = رسائل الدعم المحفوظة في الباك (GET /api/v1/contact/mine)
  loadTickets(): void {
    this.marketplace.myMessages().subscribe({
      next: (response) => {
        const items: any[] = Array.isArray(response?.data) ? response.data : [];
        this.tickets = items.map((item) => ({
          id: `#TKT-${String(item._id).slice(-4).toUpperCase()}`,
          title: item.subject || String(item.message || '').slice(0, 50),
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG') : '',
          status: item.status === 'RESOLVED' ? 'resolved' : 'pending',
        }));
        this.cdr.markForCheck();
      },
      error: () => {
        this.tickets = [];
        this.cdr.markForCheck();
      },
    });
  }

  private sendToSupport(subject: string, message: string) {
    const user = this.auth.currentUserValue;
    return this.marketplace.sendContact({
      fullName: user?.name || '',
      phone: String(user?.phone || '').trim(),
      contactType: 'personal',
      subject,
      message,
    });
  }

  faqs = [
    {
      id: 1,
      question: 'إزاي أختار الصنايعي المناسب؟',
      answer:
        'راجعي تقييمات الصنايعي، عدد الأعمال السابقة، تفاصيل العرض والضمان قبل اختيار العرض المناسب.',
      open: false,
    },
    {
      id: 2,
      question: 'إمتى بيتم تحويل مبلغ الضمان؟',
      answer: 'بيتم حجز مبلغ الضمان لحين تأكيدك إتمام العمل، وبعدها يتم تحويل المبلغ للصنايعي.',
      open: false,
    },
    {
      id: 3,
      question: 'ماذا يحدث لو الصنايعي اتأخر؟',
      answer:
        'يمكنك التواصل مع الصنايعي أولًا، وإذا لم يتم حل المشكلة يمكنك فتح تذكرة مع فريق الدعم.',
      open: false,
    },
    {
      id: 4,
      question: 'هل أقدر أتفاوض على العرض؟',
      answer: 'يمكنك التواصل مع الصنايعي لمناقشة تفاصيل العمل والسعر قبل قبول العرض.',
      open: false,
    },
    {
      id: 5,
      question: 'هل المنصة بتاخد رسوم؟',
      answer:
        'قد تختلف الرسوم حسب نوع الخدمة وطريقة تنفيذ الطلب، ويتم توضيح أي رسوم قبل إتمام العملية.',
      open: false,
    },
  ];

  tickets: { id: string; title: string; date: string; status: string }[] = [];
  ticketSending = false;

  newTicketModalOpen = false;

  ticketTitle = '';
  ticketMessage = '';
  ticketError = '';

  toggleFaq(faq: any) {
    faq.open = !faq.open;
  }

  openNewTicket() {
    this.ticketTitle = '';
    this.ticketMessage = '';
    this.ticketError = '';

    this.newTicketModalOpen = true;
  }

  closeNewTicket() {
    this.newTicketModalOpen = false;
    this.ticketError = '';
  }

  submitTicket() {
    this.ticketError = '';

    if (!this.ticketTitle.trim()) {
      this.ticketError = 'من فضلك اكتبي عنوان المشكلة.';
      return;
    }

    if (!this.ticketMessage.trim()) {
      this.ticketError = 'من فضلك اكتبي تفاصيل المشكلة.';
      return;
    }

    if (this.ticketMessage.trim().length < 10) {
      this.ticketError = 'من فضلك اكتبي تفاصيل المشكلة بشكل أوضح (10 حروف على الأقل).';
      return;
    }

    if (this.ticketSending) {
      return;
    }
    this.ticketSending = true;

    this.sendToSupport(this.ticketTitle.trim(), this.ticketMessage.trim()).subscribe({
      next: () => {
        this.ticketSending = false;
        this.closeNewTicket();
        this.loadTickets();
      },
      error: (error) => {
        this.ticketSending = false;
        this.ticketError = error?.error?.message || 'تعذر إرسال التذكرة، حاول تاني.';
        this.cdr.markForCheck();
      },
    });
  }

  isDownloadingGuide = false;
  downloadGuide() {
    if (this.isDownloadingGuide) {
      return;
    }
    this.isDownloadingGuide = true;

    const content =
      'دليل الاستخدام - أُسطى\n\n' +
      this.faqs.map((faq, i) => `${i + 1}. ${faq.question}\n${faq.answer}`).join('\n\n') +
      '\n';
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'osta-user-guide.txt';
    link.click();
    URL.revokeObjectURL(url);

    this.isDownloadingGuide = false;
    this.cdr.markForCheck();
  }
  ////////////////// دردشه
  supportChatOpen = false;
  supportMessage = '';
  supportMessages = [
    {
      sender: 'support',
      text: 'أهلًا بك في دعم أُسطى 👋 كيف يمكنني مساعدتك؟',
      time: 'الآن',
    },
  ];
  supportChips = ['عندي مشكلة في طلب', 'عايز أستفسر عن عرض', 'مشكلة في الدفع'];
  openSupportChat() {
    this.supportChatOpen = true;
  }

  closeSupportChat() {
    this.supportChatOpen = false;
  }
  sendSupport() {
    const message = this.supportMessage.trim();
    if (!message) {
      return;
    }
    this.supportMessages.push({
      sender: 'user',
      text: message,
      time: 'الآن',
    });
    this.supportMessage = '';

    if (message.length < 10) {
      this.supportMessages.push({
        sender: 'support',
        text: 'من فضلك اكتب تفاصيل أكتر شوية (10 حروف على الأقل) علشان فريق الدعم يقدر يساعدك.',
        time: 'الآن',
      });
      return;
    }

    this.sendToSupport('محادثة الدعم', message).subscribe({
      next: () => {
        this.supportMessages.push({
          sender: 'support',
          text: 'وصلتنا رسالتك ✅ فريق الدعم هيراجعها ويرد عليك في أقرب وقت. تقدر تتابعها من قائمة التذاكر.',
          time: 'الآن',
        });
        this.loadTickets();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.supportMessages.push({
          sender: 'support',
          text: error?.error?.message || 'تعذر إرسال رسالتك دلوقتي، حاول تاني.',
          time: 'الآن',
        });
        this.cdr.detectChanges();
      },
    });
  }
  sendSupportChip(message: string) {
    this.supportMessage = message;
    this.sendSupport();
  }
}
