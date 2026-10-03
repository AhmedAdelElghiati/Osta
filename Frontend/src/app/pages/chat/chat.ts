import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { JOBS_ENDPOINT } from '../../core/api.config';
import { Auth } from '../../services/auth';
import { Marketplace } from '../../services/marketplace';

interface ChatMsg {
  id: string;
  mine: boolean;
  text: string;
  time: string;
}

// الشات بيكلم: GET/POST /api/v1/jobs/:jobId/messages (متوفر في ملف الباتش backend-chat-patch)
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;

  jobId = '';
  otherName = '';
  jobTitle = '';
  messages: ChatMsg[] = [];
  input = '';
  loading = true;
  sending = false;
  error = '';
  backendMissing = false;

  private timer: any;
  private myId = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: Auth,
    private marketplace: Marketplace,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('jobId') || '';
    this.myId = String((this.auth.currentUserValue as any)?._id || (this.auth.currentUserValue as any)?.id || '');

    this.marketplace.myJobs().subscribe({
      next: (response) => {
        const job = (response?.data?.items ?? []).find((j: any) => String(j._id) === this.jobId);
        const me = this.auth.currentUserValue;
        const other = me?.role === 'artisan' ? job?.customerId : job?.artisanId;
        this.otherName = other?.name || '';
        this.jobTitle = job?.requestId?.title || '';
        this.cdr.markForCheck();
      },
    });

    this.load(true);
    this.timer = setInterval(() => this.load(false), 4000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private load(first: boolean): void {
    this.http.get<any>(`${JOBS_ENDPOINT}/${this.jobId}/messages`, { withCredentials: true }).subscribe({
      next: (response) => {
        const items: any[] = Array.isArray(response?.data) ? response.data : response?.data?.items ?? [];
        const mapped = items.map((m) => this.map(m));
        const grew = mapped.length !== this.messages.length;
        this.messages = mapped;
        this.loading = false;
        this.error = '';
        this.backendMissing = false;
        this.cdr.markForCheck();
        if (first || grew) this.scrollDown();
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 404 || err?.status === 0) {
          this.backendMissing = err?.status === 404;
        }
        this.error = err?.error?.message || 'تعذر تحميل المحادثة دلوقتي.';
        this.cdr.markForCheck();
      },
    });
  }

  private map(m: any): ChatMsg {
    const sender = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
    return {
      id: String(m._id),
      mine: !!m.mine || (!!this.myId && String(sender) === this.myId),
      text: m.text,
      time: m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
        : '',
    };
  }

  send(): void {
    const text = this.input.trim();
    if (!text || this.sending) return;
    this.sending = true;

    this.http.post<any>(`${JOBS_ENDPOINT}/${this.jobId}/messages`, { text }, { withCredentials: true }).subscribe({
      next: (response) => {
        this.sending = false;
        this.input = '';
        if (response?.data) this.messages = [...this.messages, { ...this.map(response.data), mine: true }];
        this.error = '';
        this.cdr.markForCheck();
        this.scrollDown();
      },
      error: (err) => {
        this.sending = false;
        this.error = err?.error?.message || 'تعذر إرسال الرسالة.';
        this.cdr.markForCheck();
      },
    });
  }

  private scrollDown(): void {
    setTimeout(() => {
      const el = this.scroller?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  get backLink(): string {
    return this.auth.currentUserValue?.role === 'artisan' ? '/dashboard/my-jobs' : '/customer-dashboard';
  }
}
