import { Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Job, JobPhase, JobsService } from '../Service/jobs.service';

interface ConfirmState {
  title: string;
  body: string;
  label: string;
  action: () => void;
}

const CLIENT_REPLIES = [
  'تمام يا أستاذ إبراهيم 👍',
  'الله يكرمك، مستنيينك.',
  'تمام، خد وقتك في الشغل.',
  'كويس جداً، حابب أسأل: هتحتاج خامات إضافية؟',
  'ماشاء الله، شغل نضيف. هراجع وأعتمد إن شاء الله.'
];

@Component({
  selector: 'app-dashboard-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-jobs.html',
  styleUrl: './my-jobs.css'
})
export class MyJobs {

  private jobsService = inject(JobsService);

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
  chatInput = '';
  typing = false;

  toast = '';
  private toastTimer: any;

  constructor() {
    this.jobsService.approved$
      .pipe(takeUntilDestroyed())
      .subscribe(({ net, fee }) => {
        this.showToast(
          `العميل اعتمد التسليم — ${this.fmt(net)} ج.م اتحولت لرصيدك (بعد خصم عمولة 3% = ${this.fmt(fee)} ج.م)`
        );
      });
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
    this.typing = false;
    this.scrollChat();
  }

  closeChat() {
    this.chatJob = null;
    this.typing = false;
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
    if (!job || !text) return;

    this.chatInput = '';
    this.jobsService.addMessage(job.id, { me: true, text, time: this.jobsService.nowTime() });
    this.typing = true;
    this.scrollChat();

    this.typing = false;
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
