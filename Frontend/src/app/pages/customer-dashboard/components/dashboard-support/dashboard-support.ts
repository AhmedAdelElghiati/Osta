import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../../../services/marketplace';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, ChangeDetectorRef, DestroyRef, OnInit, inject } from '@angular/core';

@Component({
  selector: 'app-dashboard-support',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-support.html',
  styleUrl: './dashboard-support.css',
})
export class DashboardSupport implements OnInit {
  constructor(private cdr: ChangeDetectorRef, private api: Marketplace) {}
  private destroyRef = inject(DestroyRef);
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

  tickets: { id: string; title: string; date: string; status: string; raw: any }[] = [];
  newTicketModalOpen = false;
  ticketTitle = '';
  ticketMessage = '';
  ticketError = '';
  sending = false;
  loading = false;
  isDownloadingGuide = false;
  supportChatOpen = false;
  supportMessage = '';
  supportMessages: { sender: string; text: string; time: string }[] = [];
  supportChips = ['عندي مشكلة في طلب', 'عايز أستفسر عن عرض', 'مشكلة في الدفع'];
  selectedTicketId = '';

  ngOnInit() {
    this.loadTickets();
    timer(10000, 10000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.supportChatOpen) this.loadTickets();
    });
  }
  loadTickets() {
    this.loading = true;
    this.api.myMessages().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.tickets = (res.data || []).map((t: any) => ({
          id: t._id, title: t.subject || 'تذكرة دعم', date: new Date(t.createdAt).toLocaleDateString('ar-EG'),
          status: t.status === 'RESOLVED' ? 'resolved' : 'pending', raw: t
        }));
        this.loading = false;
        const selected = this.tickets.find(t => t.id === this.selectedTicketId);
        if (selected) this.showMessages(selected.raw);
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.ticketError = 'تعذر تحميل تذاكر الدعم.'; this.cdr.markForCheck(); }
    });
  }
  toggleFaq(faq: any) { faq.open = !faq.open; }
  openNewTicket() { this.ticketTitle = ''; this.ticketMessage = ''; this.ticketError = ''; this.newTicketModalOpen = true; }
  closeNewTicket() { this.newTicketModalOpen = false; }
  submitTicket() {
    if (!this.ticketTitle.trim() || !this.ticketMessage.trim() || this.sending) {
      this.ticketError = 'اكتب عنوان وتفاصيل المشكلة.'; return;
    }
    this.sending = true;
    this.api.createTicket(this.ticketTitle.trim(), this.ticketMessage.trim()).subscribe({
      next: res => { this.sending = false; this.selectedTicketId = res.data._id; this.closeNewTicket(); this.loadTickets(); },
      error: err => { this.sending = false; this.ticketError = err.error?.message || 'تعذر تسجيل التذكرة.'; this.cdr.markForCheck(); }
    });
  }
  downloadGuide() {
    const text = this.faqs.map(f => f.question + '\n' + f.answer).join('\n\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ossta-guide.txt'; link.click(); URL.revokeObjectURL(url);
  }
  selectTicket(ticket: any) {
    this.selectedTicketId = ticket.id; this.showMessages(ticket.raw); this.supportChatOpen = true;
  }
  private showMessages(ticket: any) {
    this.supportMessages = [{ sender: 'user', text: ticket.message, time: new Date(ticket.createdAt).toLocaleString('ar-EG') },
      ...(ticket.replies || []).map((r: any) => ({
        sender: r.senderRole === 'admin' ? 'support' : 'user', text: r.text, time: new Date(r.createdAt).toLocaleString('ar-EG')
      }))];
  }
  openSupportChat() {
    this.supportChatOpen = true;
    if (!this.selectedTicketId && this.tickets.length) this.selectTicket(this.tickets[0]);
    this.loadTickets();
  }
  closeSupportChat() { this.supportChatOpen = false; }
  sendSupport() {
    const text = this.supportMessage.trim();
    if (!text || this.sending) return;
    this.sending = true;
    const request = this.selectedTicketId ? this.api.replyToTicket(this.selectedTicketId, text) : this.api.createTicket('محادثة الدعم', text);
    request.subscribe({
      next: res => {
        this.sending = false; this.selectedTicketId = res.data._id; this.showMessages(res.data); this.supportMessage = '';
        this.loadTickets(); this.cdr.markForCheck();
      },
      error: err => { this.sending = false; this.ticketError = err.error?.message || 'تعذر إرسال الرسالة.'; this.cdr.markForCheck(); }
    });
  }
  sendSupportChip(message: string) { this.supportMessage = message; this.sendSupport(); }
}
