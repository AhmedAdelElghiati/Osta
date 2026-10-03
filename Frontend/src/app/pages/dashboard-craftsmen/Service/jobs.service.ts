import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { JOBS_ENDPOINT } from '../../../core/api.config';

export type JobPhase = 'معاينة' | 'تنفيذ' | 'انتظار' | 'مكتمل';

export interface ChatMessage {
  me: boolean;
  text: string;
  time: string;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  area: string;
  phase: JobPhase;
  price: number;
  escrow: number;
  note: string;
  inv?: string;
  chat: ChatMessage[];
}

const PHASE_BY_STATUS: Record<string, JobPhase> = {
  NOT_STARTED: 'معاينة',
  IN_PROGRESS: 'تنفيذ',
  WAITING_FOR_CLIENT: 'انتظار',
  DELIVERED: 'انتظار',
  COMPLETED: 'مكتمل',
};

@Injectable({ providedIn: 'root' })
export class JobsService {
  approved$ = new Subject<{ job: Job; net: number; fee: number }>();

  jobs: Job[] = [];
  loading = false;
  error = '';

  constructor(private http: HttpClient) {
    this.load();
  }

  get activeJobs() {
    return this.jobs.filter((job) => job.phase !== 'مكتمل');
  }

  get completedJobs() {
    return this.jobs.filter((job) => job.phase === 'مكتمل');
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${JOBS_ENDPOINT}/me`, { withCredentials: true }).subscribe({
      next: (response) => {
        const items = response?.data?.items ?? [];
        this.jobs = items.map((item: any) => this.mapJob(item));
        this.loading = false;
      },
      error: () => {
        this.error = 'مش قادرين نجيب شغلاناتك دلوقتي.';
        this.loading = false;
      },
    });
  }

  startExecution(id: string) {
    this.updateStatus(id, 'IN_PROGRESS');
  }

  finishJob(id: string) {
    this.updateStatus(id, 'DELIVERED');
  }

  addMessage(id: string, message: ChatMessage) {
    this.find(id)?.chat.push(message);
  }

  nowTime() {
    return new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  }

  private updateStatus(id: string, status: 'IN_PROGRESS' | 'DELIVERED') {
    this.http.patch<any>(`${JOBS_ENDPOINT}/${id}/status`, { status }, { withCredentials: true }).subscribe({
      next: (response) => this.upsert(this.mapJob(response.data)),
      error: () => {
        this.error = 'العملية ماكملتش. جرّب تاني.';
      },
    });
  }

  private find(id: string) {
    return this.jobs.find((job) => job.id === id);
  }

  private upsert(job: Job) {
    const index = this.jobs.findIndex((item) => item.id === job.id);
    if (index === -1) {
      this.jobs.unshift(job);
      return;
    }
    this.jobs[index] = { ...job, chat: this.jobs[index].chat };
  }

  private mapJob(raw: any): Job {
    const request = raw.requestId ?? {};
    const client = raw.customerId ?? {};
    const location = request.location ?? {};
    const phase = PHASE_BY_STATUS[raw.status] ?? 'معاينة';

    return {
      id: String(raw._id ?? raw.id),
      title: request.title ?? 'شغلانة جديدة',
      client: client.name ?? 'عميل أُسطى',
      area: [location.area, location.city].filter(Boolean).join('، '),
      phase,
      price: Number(raw.price ?? raw.offerId?.price ?? 0),
      escrow: raw.paymentStatus === 'RELEASED' ? 0 : Number(raw.price ?? 0),
      inv: raw.completedAt ? `INV-${String(raw._id ?? '').slice(-4).toUpperCase()}` : undefined,
      note: this.noteFor(raw.status),
      chat: [],
    };
  }

  private noteFor(status: string): string {
    switch (status) {
      case 'NOT_STARTED':
        return 'العرض اتقبل والشغلانة جاهزة للبدء.';
      case 'IN_PROGRESS':
        return 'بدأ التنفيذ. بعد ما تخلص ابعت الشغل للمراجعة.';
      case 'DELIVERED':
      case 'WAITING_FOR_CLIENT':
        return 'تم إرسال التسليم والعميل بيراجع الشغل.';
      case 'COMPLETED':
        return 'تم الاعتماد والصرف.';
      default:
        return 'تابع حالة الشغلانة من هنا.';
    }
  }
}
