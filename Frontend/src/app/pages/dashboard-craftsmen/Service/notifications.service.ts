import { Injectable, computed, inject, signal } from '@angular/core';
import { Marketplace } from '../../../services/marketplace';
import { Auth } from '../../../services/auth';
import { AccountService } from './account.service';
import { JobsService } from './jobs.service';
import { OffersService } from './offers.service';
import { RequestsService } from './requests.service';

export interface AppNotification {
  id: string;
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

  private marketplace = inject(Marketplace);
  private auth = inject(Auth);

  private seq = 0;

  // الإشعارات بتتحمل من الباك: GET /api/v1/notifications
  items = signal<AppNotification[]>([]);

  /** النقطة الصفرا على الجرس: بتظهر مع أي إشعار جديد وبتختفي لما تفتح القايمة */
  hasNew = signal(false);

  unread = computed(() => this.items().filter(n => !n.read).length);

  constructor() {
    this.load();
    // تحديث دوري كل 30 ثانية
    setInterval(() => {
      if (this.auth.getAccessToken()) this.load();
    }, 30000);

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

  load(): void {
    this.marketplace.notifications().subscribe({
      next: (response) => {
        const serverItems: AppNotification[] = (Array.isArray(response?.data) ? response.data : []).map(
          (n: any) => ({
            id: String(n._id),
            title: n.title || '',
            message: n.description || n.details || '',
            link: n.link || '/dashboard/home',
            read: !!n.isRead,
          })
        );
        const localItems = this.items().filter(n => n.id.startsWith('local-'));
        const hadUnread = this.unread();
        this.items.set([...localItems, ...serverItems]);
        if (this.unread() > hadUnread) this.hasNew.set(true);
      },
      error: () => {},
    });
  }

  add(title: string, message: string, link: string) {
    this.items.update(list => [
      { id: `local-${this.seq++}`, title, message, link, read: false },
      ...list
    ]);
    this.hasNew.set(true);
  }

  markSeen() {
    this.hasNew.set(false);
  }

  markRead(id: string) {
    this.items.update(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
    if (!id.startsWith('local-')) {
      this.marketplace.markNotificationRead(id).subscribe({ error: () => {} });
    }
  }

  markAllRead() {
    this.items.update(list => list.map(n => ({ ...n, read: true })));
    this.marketplace.markAllNotificationsRead().subscribe({ error: () => {} });
  }

  private fmt(n: number) {
    return n.toLocaleString('en-US');
  }
}