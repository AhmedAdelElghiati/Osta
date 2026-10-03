import { Injectable, computed, inject, signal } from '@angular/core';
import { Marketplace } from '../../services/marketplace';
import { Auth } from '../../services/auth';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private api = inject(Marketplace);
  items = signal<AppNotification[]>([]);
  hasNew = signal(false);
  error = signal('');
  unread = computed(() => this.items().filter(n => !n.read).length);

  constructor(auth: Auth) {
    auth.currentUser$.subscribe(user => {
      this.items.set([]);
      this.hasNew.set(false);
      if (user?.role === 'artisan') this.load();
    });
  }

  load() {
    this.api.notifications().subscribe({
      next: res => {
        this.items.set((res.data ?? []).map((n: any) => ({
          id: n._id, title: n.title, message: n.description || n.details,
          link: n.link || '/dashboard/home', read: n.isRead,
        })));
        this.hasNew.set(this.unread() > 0);
        this.error.set('');
      },
      error: () => this.error.set('تعذر تحميل الإشعارات.'),
    });
  }

  markSeen() { this.hasNew.set(false); this.load(); }
  markRead(id: string) {
    this.api.markNotificationRead(id).subscribe({
      next: () => this.items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n)),
      error: () => this.error.set('تعذر تحديث الإشعار.'),
    });
  }
  markAllRead() {
    this.api.markAllNotificationsRead().subscribe({
      next: () => { this.items.update(list => list.map(n => ({ ...n, read: true }))); this.hasNew.set(false); },
      error: () => this.error.set('تعذر تحديث الإشعارات.'),
    });
  }
}
