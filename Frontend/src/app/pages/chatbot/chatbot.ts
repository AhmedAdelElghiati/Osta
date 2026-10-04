import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Marketplace } from '../../services/marketplace';
import { RouterLink } from '@angular/router';
import { timeout } from 'rxjs';

interface Message { sender: 'user' | 'bot'; text: string; isError?: boolean; actions?: { label: string; path: string }[]; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;
  isOpen = false;
  userInput = '';
  loading = false;
  private lastQuestion = '';
  resetChat() { if (this.loading) return; this.messages = [{ sender: 'bot', text: 'أهلاً بك في أُسطى. كيف أساعدك؟' }]; this.userInput = ''; }
  handleEnter(event: Event) { const key = event as KeyboardEvent; if (!key.shiftKey && !key.isComposing) { event.preventDefault(); this.sendMessage(); } }
  retryMessage() { if (!this.lastQuestion || this.loading) return; this.userInput = this.lastQuestion; this.sendMessage(); }
  private shouldScroll = false;
  quickReplies = ['طلب صنايعي', 'محادثة مباشرة', 'الخدمات المتاحة', 'طرق الدفع'];
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
    this.lastQuestion = message;
    this.userInput = '';
    this.loading = true;
    this.shouldScroll = true;
    this.api.assistant(message).pipe(timeout(15000)).subscribe({
      next: response => this.finish(response.data.reply, false, response.data.actions),
      error: () => this.finish('تعذر الوصول للمساعد الآن. حاول مرة أخرى أو تواصل مع الدعم.', true),
    });
  }
  private finish(text: string, isError = false, actions?: { label: string; path: string }[]) {
    this.messages.push({ sender: 'bot', text, isError, actions });
    this.loading = false;
    this.shouldScroll = true;
    this.cdr.markForCheck();
  }
}
