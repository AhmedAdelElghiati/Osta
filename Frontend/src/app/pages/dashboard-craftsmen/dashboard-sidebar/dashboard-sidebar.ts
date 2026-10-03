// import { Component, EventEmitter, Input, Output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterLink, RouterLinkActive } from '@angular/router';

// @Component({
//   selector: 'app-dashboard-sidebar',
//   standalone: true,
//   imports: [CommonModule, RouterLink, RouterLinkActive],
//   templateUrl: './dashboard-sidebar.html',
//   styleUrl: './dashboard-sidebar.css'
// })
// export class DashboardSidebar {

//   @Input() open = false;
//   @Output() closeSidebar = new EventEmitter<void>();

//   onClose() {
//     this.closeSidebar.emit();
//   }
// }


import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccountService } from '../Service/account.service';
import { JobsService } from '../Service/jobs.service';
import { OffersService } from '../Service/offers.service';
import { RequestsService } from '../Service/requests.service';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-sidebar.html',
  styleUrl: './dashboard-sidebar.css'
})
export class DashboardSidebar {

  private accountService = inject(AccountService);
  private requestsService = inject(RequestsService);
  private offersService = inject(OffersService);
  private jobsService = inject(JobsService);

  @Input() open = false;
  @Output() closeSidebar = new EventEmitter<void>();

  get account() {
    return this.accountService.account;
  }

  get initials() {
    return this.account.name
      .replace(/^الأسطى\s+/, '')
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0])
      .join(' ');
  }

  get requestsCount() {
    return this.requestsService.openRequests.length;
  }

  get offersCount() {
    return this.offersService.pendingOffers.length;
  }

  get jobsCount() {
    return this.jobsService.activeJobs.length;
  }

  onClose() {
    this.closeSidebar.emit();
  }
}