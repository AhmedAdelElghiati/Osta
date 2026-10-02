import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard-support',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-support.html',
  styleUrl: './dashboard-support.css',
})
export class DashboardSupport {
  constructor(private cdr: ChangeDetectorRef) {}
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

  tickets = [
    {
      id: '#TKT-332',
      title: 'استفسار عن موعد تنفيذ الطلب',
      date: 'اليوم',
      status: 'pending',
    },
    {
      id: '#TKT-318',
      title: 'مشكلة في عرض مقدم من صنايعي',
      date: '20 مايو',
      status: 'resolved',
    },
  ];

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

    this.tickets.unshift({
      id: `#TKT-${Math.floor(100 + Math.random() * 900)}`,
      title: this.ticketTitle,
      date: 'اليوم',
      status: 'pending',
    });
    this.closeNewTicket();
  }

  isDownloadingGuide = false;
  downloadGuide() {
    this.isDownloadingGuide = true;
    setTimeout(() => {
      this.isDownloadingGuide = false;
      this.cdr.detectChanges();
    }, 3000);
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
    setTimeout(() => {
      const lowerMessage = message.toLowerCase();
      let replies: string[] = [];
      if (
        lowerMessage.includes('دفع') ||
        lowerMessage.includes('فلوس') ||
        lowerMessage.includes('محفظة') ||
        lowerMessage.includes('مبلغ')
      ) {
        replies = [
          'أكيد، أقدر أساعدك في مشكلة الدفع أو المحفظة.',
          'تمام، خليني أوضحلك خطوات الدفع ومتابعة المبلغ.',
          'ممكن توضحيلي المشكلة اللي ظهرت أثناء عملية الدفع؟',
        ];
      } else if (
        lowerMessage.includes('طلب') ||
        lowerMessage.includes('شغلانة') ||
        lowerMessage.includes('تنفيذ')
      ) {
        replies = [
          'تمام، ممكن تبعتيلي رقم الطلب علشان أراجع تفاصيله؟',
          'أكيد، أقدر أساعدك في متابعة حالة الطلب.',
          'خليني أساعدك في متابعة الشغلانة ومعرفة آخر تحديث.',
        ];
      } else if (
        lowerMessage.includes('عرض') ||
        lowerMessage.includes('مقايسة') ||
        lowerMessage.includes('سعر')
      ) {
        replies = [
          'أكيد، أقدر أساعدك في فهم تفاصيل العرض ومقارنته بالعروض الأخرى.',
          'ممكن توضحيلي أي عرض محتاجة تعرفي تفاصيله؟',
          'تمام، خليني أساعدك في متابعة المقايسات والعروض.',
        ];
      } else if (
        lowerMessage.includes('صنايعي') ||
        lowerMessage.includes('حرفي') ||
        lowerMessage.includes('ورشة')
      ) {
        replies = [
          'أكيد، أقدر أساعدك في اختيار الصنايعي المناسب.',
          'ممكن توضحيلي المشكلة أو الاستفسار الخاص بالصنايعي؟',
          'تمام، خليني أساعدك في متابعة بيانات الصنايعي.',
        ];
      } else if (
        lowerMessage.includes('مشكلة') ||
        lowerMessage.includes('شكوى') ||
        lowerMessage.includes('مش شغال') ||
        lowerMessage.includes('مش شغالة')
      ) {
        replies = [
          'آسفين على المشكلة، خليني أساعدك في حلها.',
          'تمام، ممكن توضحيلي المشكلة بالتفصيل؟',
          'متقلقيش، هنحاول نساعدك في حل المشكلة بأسرع وقت.',
        ];
      } else {
        replies = [
          'أهلًا بك، إزاي أقدر أساعدك؟',
          'تمام، أنا معاكِ. ممكن توضحيلي استفسارك؟',
          'شكرًا لتواصلك معنا، قوليلي محتاجة مساعدة في إيه؟',
        ];
      }
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      this.supportMessages.push({
        sender: 'support',
        text: randomReply,
        time: 'الآن',
      });
      this.cdr.detectChanges();
    }, 800);
  }
  sendSupportChip(message: string) {
    this.supportMessage = message;
    this.sendSupport();
  }
}
