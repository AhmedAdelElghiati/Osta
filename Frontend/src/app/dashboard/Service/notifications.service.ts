import { Injectable, computed, inject, signal } from '@angular/core';
import { AccountService } from './account.service';
import { JobsService } from './jobs.service';
import { OffersService } from './offers.service';
import { RequestsService } from './requests.service';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  link: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {

  private account = inject(AccountService);
  private jobs = inject(JobsService);
  private offers = inject(OffersService);
  private requests = inject(RequestsService);

  private seq = 4;

  items = signal<AppNotification[]>([
    { id: 1, read: false, link: '/dashboard/available-requests', title: 'طلب جديد قريب منك 📍', message: 'تسريب مياه بالمطبخ — 1.8 كم • ميزانية 1,500 ج.م' },
    { id: 2, read: false, link: '/dashboard/available-requests', title: 'طلب بميزانية عالية 💰', message: 'تأسيس سباكة شقة 140م — 25,000 ج.م' },
    { id: 3, read: false, link: '/dashboard/my-jobs', title: 'العميلة أكدت موعد المعاينة', message: 'تركيب سخانات — غداً 11:00 ص' }
  ]);

  /** النقطة الصفرا على الجرس: بتظهر مع أي إشعار جديد وبتختفي لما تفتح القايمة */
  hasNew = signal(true);

  unread = computed(() => this.items().filter(n => !n.read).length);

  constructor() {
    this.requests.arrived$.subscribe(r => {
      if (!this.account.prefs.newRequests) return;
      this.add(
        'طلب جديد قريب منك 📍',
        `${r.title} — ${r.dist} • ${r.budget ? this.fmt(r.budget) + ' ج.م' : 'ميزانية مرنة'}`,
        '/dashboard/available-requests'
      );
    });

    this.offers.accepted$.subscribe(({ offer }) => {
      if (!this.account.prefs.offerUpdates) return;
      this.add(
        'العميل قبل عرضك! 🎉',
        `${offer.title} — ${this.fmt(offer.price)} ج.م محجوزة في الضمان`,
        '/dashboard/my-jobs'
      );
    });

    this.jobs.approved$.subscribe(({ job, net }) => {
      if (!this.account.prefs.escrow) return;
      this.add(
        'العميل اعتمد التسليم ✅',
        `${job.title} — ${this.fmt(net)} ج.م اتحولت لرصيدك`,
        '/dashboard/earnings'
      );
    });
  }

  add(title: string, message: string, link: string) {
    this.items.update(list => [
      { id: this.seq++, title, message, link, read: false },
      ...list
    ]);
    this.hasNew.set(true);
  }

  markSeen() {
    this.hasNew.set(false);
  }

  markRead(id: number) {
    this.items.update(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
  }

  markAllRead() {
    this.items.update(list => list.map(n => ({ ...n, read: true })));
  }

  private fmt(n: number) {
    return n.toLocaleString('en-US');
  }
}