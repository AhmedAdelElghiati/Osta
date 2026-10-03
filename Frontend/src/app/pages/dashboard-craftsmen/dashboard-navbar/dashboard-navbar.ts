

// import { Component, EventEmitter, HostListener, Output, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { AvailabilityService } from '../Service/availability.service';
// import { SearchService } from '../Service/search.service';

// interface Notification {
//   title: string;
//   message: string;
// }

// @Component({
//   selector: 'app-dashboard-navbar',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './dashboard-navbar.html',
//   styleUrl: './dashboard-navbar.css'
// })
// export class DashboardNavbar {

//   private availability = inject(AvailabilityService);
//   private searchService = inject(SearchService);
//   private router = inject(Router);

//   @Output() toggleSidebar = new EventEmitter<void>();

//   notificationsOpen = false;

//   notifications: Notification[] = [
//     { title: 'طلب جديد قريب منك 📍', message: 'تسريب مياه بالمطبخ — 1.8 كم • ميزانية 1,500 ج.م' },
//     { title: 'طلب بميزانية عالية 💰', message: 'تأسيس سباكة شقة 140م — 25,000 ج.م' },
//     { title: 'العميلة أكدت موعد المعاينة', message: 'تركيب سخانات — غداً 11:00 ص' }
//   ];

//   /** نص البحث مربوط بالـ service، والتنقل بيحصل أول ما تكتب */
//    get searchText() {
//     return this.searchService.query();
//   }

//   set searchText(value: string) {
//     this.searchService.query.set(value);

//     if (value.trim() && !this.router.url.includes('available-requests')) {
//       this.router.navigate(['/dashboard/available-requests']);
//     }
//   }

//   get isAvailable() {
//     return this.availability.isAvailable();
//   }

//   toggleAvailability() {
//     this.availability.toggle();
//   }

//   onToggleSidebar() {
//     this.toggleSidebar.emit();
//   }

//   toggleNotifications(event: Event) {
//     event.stopPropagation();
//     this.notificationsOpen = !this.notificationsOpen;
//   }

//   markNotificationsRead() {
//     this.notifications = [];
//     this.notificationsOpen = false;
//   }

//   @HostListener('document:click')
//   onDocumentClick() {
//     this.notificationsOpen = false;
//   }
// }



import { Component, EventEmitter, HostListener, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AvailabilityService } from '../Service/availability.service';
import { SearchService } from '../Service/search.service';
import { AppNotification, NotificationsService } from '../Service/notifications.service';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-navbar.html',
  styleUrl: './dashboard-navbar.css'
})
export class DashboardNavbar {

  private availability = inject(AvailabilityService);
  private searchService = inject(SearchService);
  private notifService = inject(NotificationsService);
  private router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  notificationsOpen = false;

  /* البحث */
  get searchText() {
    return this.searchService.query();
  }

  set searchText(value: string) {
    this.searchService.query.set(value);

    if (value.trim() && !this.router.url.includes('available-requests')) {
      this.router.navigate(['/dashboard/available-requests']);
    }
  }

  /* التواجد */
  get isAvailable() {
    return this.availability.isAvailable();
  }

  toggleAvailability() {
    this.availability.toggle();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  /* الإشعارات */
  get notifications() {
    return this.notifService.items();
  }

  get hasNew() {
    return this.notifService.hasNew();
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.notifService.markSeen();
  }

  openNotification(n: AppNotification) {
    this.notifService.markRead(n.id);
    this.notificationsOpen = false;
    if (n.link) this.router.navigate([n.link]);
  }

  markNotificationsRead() {
    this.notifService.markAllRead();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.notificationsOpen = false;
  }
}