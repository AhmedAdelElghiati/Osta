import { ChangeDetectorRef, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Job, JobPhase, JobsService } from '../Service/jobs.service';
import { Chat, ChatMessage } from '../../services/chat';

interface ConfirmState {
  title: string;
  body: string;
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-dashboard-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-jobs.html',
  styleUrl: './my-jobs.css'
})
export class MyJobs implements OnDestroy {

  private jobsService = inject(JobsService);
  private chatService = inject(Chat);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLElement>;

  activeTab: 'active' | 'done' = 'active';

  phaseLabels: Record<JobPhase, string> = {
    'معاينة': 'معاينة مجدولة',
    'تنفيذ': 'جاري التنفيذ',
    'انتظار': 'بانتظار اعتماد العميل',
    'مكتمل': 'مكتملة'
  };

  phaseClass: Record<JobPhase, string> = {
    'معاينة': 'phase-visit',
    'تنفيذ': 'phase-progress',
    'انتظار': 'phase-review',
    'مكتمل': 'phase-done'
  };

  confirm: ConfirmState | null = null;

  chatJob: Job | null = null;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  chatLoading = false;
  sendingMessage = false;
  chatError = '';
  chatConnection = 'connecting';

  toast = '';
  private toastTimer: any;

  constructor() {
    this.chatService.joined$.pipe(takeUntilDestroyed()).subscribe((jobId) => {
      this.chatService.loadMessages(jobId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (messages) => {
          if (this.chatJob?.id !== jobId) return;
          this.chatMessages = this.mergeMessages(messages, this.chatMessages);
          this.cdr.markForCheck();
          this.scrollChat();
        },
        error: () => {
          if (this.chatJob?.id !== jobId) return;
          this.chatError = 'تعذر تحديث الرسائل. افتح المحادثة مرة أخرى.';
          this.cdr.markForCheck();
        },
      });
    });
    this.jobsService.approved$
      .pipe(takeUntilDestroyed())
      .subscribe(({ net, fee }) => {
        this.showToast(
          `العميل اعتمد التسليم — ${this.fmt(net)} ج.م اتحولت لرصيدك (بعد خصم عمولة 3% = ${this.fmt(fee)} ج.م)`
        );
      });
    this.chatService.messages$
      .pipe(takeUntilDestroyed())
      .subscribe((message) => {
        if (message.jobId === this.chatJob?.id) this.addMessage(message);
      });
    this.chatService.connectionStatus$
      .pipe(takeUntilDestroyed())
      .subscribe((status) => {
        this.chatConnection = status;
        this.cdr.markForCheck();
      });
    this.chatService.socketErrors$
      .pipe(takeUntilDestroyed())
      .subscribe((error) => {
        this.chatError = error;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.chatService.closeConversation();
    clearTimeout(this.toastTimer);
  }

  get activeJobs() {
    return this.jobsService.activeJobs;
  }

  get completedJobs() {
    return this.jobsService.completedJobs;
  }

  get displayedJobs() {
    return this.activeTab === 'active' ? this.activeJobs : this.completedJobs;
  }

  /* ========== تأكيد الإجراءات ========== */

  askStart(job: Job) {
    this.confirm = {
      title: 'تأكيد انتهاء المعاينة',
      body: 'هل تمت المعاينة واتفقتم على بدء التنفيذ؟',
      label: 'بدء التنفيذ',
      action: () => {
        this.jobsService.startExecution(job.id);
        this.showToast('بدأ تنفيذ الشغلانة — موفق يا أسطى');
      }
    };
  }

  askFinish(job: Job) {
    this.confirm = {
      title: 'إنهاء التنفيذ',
      body: 'سيتم إرسال طلب اعتماد للعميل، والمبلغ بيتحرر في محفظتك أول ما يعتمد التسليم.',
      label: 'إنهاء وطلب الاعتماد',
      action: () => {
        this.jobsService.finishJob(job.id);
        this.showToast('تم إرسال طلب الاعتماد للعميل — المبلغ بيتحرر أول ما يعتمد');
      }
    };
  }

  runConfirm() {
    const c = this.confirm;
    this.confirm = null;
    c?.action();
  }

  closeConfirm() {
    this.confirm = null;
  }

  /* ========== المحادثة ========== */

  openChat(job: Job) {
    this.chatJob = job;
    this.chatInput = '';
    this.chatMessages = [];
    this.chatError = '';
    this.chatLoading = true;
    this.chatService.openConversation(job.id);
    this.chatService.loadMessages(job.id).subscribe({
      next: (messages) => {
        if (this.chatJob?.id !== job.id) return;
        this.chatMessages = this.mergeMessages(messages, this.chatMessages);
        this.chatLoading = false;
        this.cdr.markForCheck();
        this.scrollChat();
      },
      error: (error) => {
        if (this.chatJob?.id !== job.id) return;
        this.chatError = error?.error?.message || 'تعذر تحميل الرسائل.';
        this.chatLoading = false;
        this.cdr.markForCheck();
      },
    });
    this.scrollChat();
  }

  closeChat() {
    this.chatJob = null;
    this.chatService.closeConversation();
  }

  avatar(client: string) {
    return client
      .replace('أ. ', '')
      .replace('م. ', '')
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join(' ');
  }

  sendMessage() {
    const job = this.chatJob;
    const text = this.chatInput.trim();
    if (!job || !text || this.sendingMessage) return;

    this.sendingMessage = true;
    this.chatError = '';
    this.chatService.sendMessage(job.id, text).subscribe({
      next: (message) => {
        if (this.chatJob?.id === job.id) {
          this.addMessage(message);
          if (this.chatInput.trim() === text) this.chatInput = '';
        }
        this.sendingMessage = false;
        this.cdr.markForCheck();
        this.scrollChat();
      },
      error: (error) => {
        this.chatError = error?.error?.message || 'تعذر إرسال الرسالة. حاول مرة أخرى.';
        this.sendingMessage = false;
        this.cdr.markForCheck();
      },
    });
  }

  private addMessage(message: ChatMessage) {
    if (!this.chatMessages.some((item) => item.id === message.id)) {
      this.chatMessages = [...this.chatMessages, message];
      this.cdr.markForCheck();
      this.scrollChat();
    }
  }

  private mergeMessages(...groups: ChatMessage[][]) {
    return [...new Map(groups.flat().map((message) => [message.id, message])).values()].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
  }

  private scrollChat() {
    setTimeout(() => {
      const el = this.chatScroll?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  /* ========== Toast ========== */

  showToast(message: string) {
    this.toast = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 3500);
  }

  fmt(n: number) {
    return n.toLocaleString('en-US');
  }
}
