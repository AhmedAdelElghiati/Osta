import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chat, ChatJob, ChatMessage } from '../../../../services/chat';
import { Auth } from '../../../../services/auth';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-chat.html',
  styleUrl: './dashboard-chat.css',
})
export class DashboardChat implements OnInit, OnDestroy {
  private readonly chat = inject(Chat);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  jobs: ChatJob[] = [];
  selectedJob: ChatJob | null = null;
  messages: ChatMessage[] = [];
  messageText = '';
  jobsLoading = true;
  messagesLoading = false;
  sending = false;
  error = '';
  connectionStatus = 'connecting';

  get participantLabel(): string {
    return this.auth.currentUserValue?.role === 'artisan' ? 'العميل' : 'الصنايعي';
  }

  participantName(job: ChatJob): string {
    const participant = this.auth.currentUserValue?.role === 'artisan' ? job.customerId : job.artisanId;
    return participant?.name || this.participantLabel;
  }

  ngOnInit(): void {
    this.chat.joined$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((jobId) => {
      this.chat.loadMessages(jobId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (messages) => {
          if (this.selectedJob?._id !== jobId) return;
          this.messages = this.mergeMessages(messages, this.messages);
          this.scrollToLatest();
          this.cdr.markForCheck();
        },
        error: () => {
          if (this.selectedJob?._id !== jobId) return;
          this.error = 'تعذر تحديث الرسائل. افتح المحادثة مرة أخرى.';
          this.cdr.markForCheck();
        },
      });
    });
    this.chat.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      if (message.jobId === this.selectedJob?._id) this.addMessage(message);
      this.cdr.markForCheck();
    });
    this.chat.connectionStatus$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((status) => {
      this.connectionStatus = status;
      this.cdr.markForCheck();
    });
    this.chat.socketErrors$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((error) => {
      this.error = error;
      this.cdr.markForCheck();
    });

    this.chat.listJobs().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.jobsLoading = false;
        const target = this.route.snapshot.queryParamMap.get('conversation');
        if (jobs.length) this.selectJob(jobs.find(job => job._id === target) || jobs[0]);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.jobsLoading = false;
        this.error = error?.error?.message || 'تعذر تحميل محادثاتك. حاول مرة أخرى.';
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.chat.closeConversation();
  }

  selectJob(job: ChatJob): void {
    this.selectedJob = job;
    this.messageText = '';
    this.messages = [];
    this.error = '';
    this.messagesLoading = true;
    this.chat.openConversation(job._id);
    this.chat.loadMessages(job._id).subscribe({
      next: (messages) => {
        if (this.selectedJob?._id !== job._id) return;
        this.messages = this.mergeMessages(messages, this.messages);
        this.messagesLoading = false;
        this.scrollToLatest();
        this.cdr.markForCheck();
      },
      error: (error) => {
        if (this.selectedJob?._id !== job._id) return;
        this.messagesLoading = false;
        this.error = error?.error?.message || 'تعذر تحميل الرسائل.';
        this.cdr.markForCheck();
      },
    });
  }

  sendMessage(): void {
    const job = this.selectedJob;
    const text = this.messageText.trim();
    if (!job || !text || this.sending) return;

    this.sending = true;
    this.error = '';
    this.chat.sendMessage(job._id, text).subscribe({
      next: (message) => {
        if (this.selectedJob?._id === job._id) {
          this.addMessage(message);
          if (this.messageText.trim() === text) this.messageText = '';
        }
        this.sending = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error = error?.error?.message || 'تعذر إرسال الرسالة. حاول مرة أخرى.';
        this.sending = false;
        this.cdr.markForCheck();
      },
    });
  }

  private addMessage(message: ChatMessage): void {
    if (!this.messages.some((existing) => existing.id === message.id)) {
      this.messages = [...this.messages, message];
      this.scrollToLatest();
    }
  }

  private scrollToLatest(): void {
    setTimeout(() => {
      const list = this.messageList?.nativeElement;
      if (list) list.scrollTop = list.scrollHeight;
    });
  }

  private mergeMessages(...groups: ChatMessage[][]): ChatMessage[] {
    return [...new Map(groups.flat().map((message) => [message.id, message])).values()].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
  }
}
