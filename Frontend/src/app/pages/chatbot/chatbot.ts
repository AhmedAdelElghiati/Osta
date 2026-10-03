import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';

interface Message { sender: 'user' | 'bot'; text: string; isError?: boolean; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;
  isOpen = false;
  userInput = '';
  loading = false;
  private shouldScroll = false;
  quickReplies = ['إزاي أحجز فني؟', 'إزاي أسجل كحرفي؟', 'طرق الدفع إيه؟', 'الخدمات المتاحة'];
  messages: Message[] = [{ sender: 'bot', text: 'أهلاً بك في أُسطى. كيف أساعدك؟' }];

  constructor(private api: Marketplace, private cdr: ChangeDetectorRef) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      const element = this.scrollContainer?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
      this.shouldScroll = false;
    }
  }
  toggleChat() { this.isOpen = !this.isOpen; this.shouldScroll = this.isOpen; }
  sendQuickReply(text: string) { this.userInput = text; this.sendMessage(); }
  sendMessage() {
    const message = this.userInput.trim();
    if (!message || this.loading) return;
    if (message.length > 1000) {
      this.messages.push({ sender: 'bot', text: 'السؤال لا يجب أن يتجاوز 1000 حرف.', isError: true });
      return;
    }
    this.messages.push({ sender: 'user', text: message });
    this.userInput = '';
    this.loading = true;
    this.shouldScroll = true;
    this.api.assistant(message).subscribe({
      next: response => this.finish(response.data.reply),
      error: () => this.finish('تعذر الوصول للمساعد الآن. حاول مرة أخرى أو تواصل مع الدعم.', true),
    });
  }
  private finish(text: string, isError = false) {
    this.messages.push({ sender: 'bot', text, isError });
    this.loading = false;
    this.shouldScroll = true;
    this.cdr.markForCheck();
  }
}
