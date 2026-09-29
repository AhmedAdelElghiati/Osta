import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-home',
  imports: [CommonModule],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome {
  @Input() activeJobsCount = 0;
  @Input() completedJobsCount = 0;
  @Input() escrowAmount = 0;
  @Input() walletBalance = 0;
  @Input() activeRequests: any[] = [];
  @Input() detailsData: any = {}; 
  @Input() kitchenOffers: any[] = [];
  // Navigation
  // =========================

  @Output() pageChange = new EventEmitter<string>();

  @Output() requestDetails = new EventEmitter<string>();

  goToPage(page: string) {
    this.pageChange.emit(page);
  }

  openRequest(requestId: string) {
    this.requestDetails.emit(requestId);
  }

  // =========================
  // Accept Offer Modal
  // =========================

  acceptModalOpen = false;

  selectedOffer = {
    name: '',
    price: 0,
    duration: '',
  };

  openAccept(name: string, price: number, duration: string) {
    this.selectedOffer = {
      name,
      price,
      duration,
    };

    this.acceptModalOpen = true;
  }

  closeAcceptModal() {
    this.acceptModalOpen = false;
  }

  confirmAccept() {
    console.log('Accepted offer:', this.selectedOffer);

    this.closeAcceptModal();
  }

  // =========================
  // Quote Modal
  // =========================

  quoteModalOpen = false;

  selectedQuote = {
    name: '',
    subtitle: '',
    items: [] as {
      name: string;
      price: number;
    }[],
    total: 0,
  };

  openQuote(name: string) {
    this.selectedQuote = {
      name: name,

      subtitle: 'تفاصيل عرض السعر',

      items: [
        {
          name: 'فك وتركيب المطبخ',
          price: 2500,
        },
        {
          name: 'أعمال النجارة والتجديد',
          price: 5200,
        },
        {
          name: 'المفصلات والإكسسوارات',
          price: 1200,
        },
        {
          name: 'التسليم والتركيب النهائي',
          price: 900,
        },
      ],

      total: 9800,
    };

    this.quoteModalOpen = true;
  }

  closeQuoteModal() {
    this.quoteModalOpen = false;
  }

  acceptQuote() {
    this.quoteModalOpen = false;

    this.openAccept(this.selectedQuote.name, this.selectedQuote.total, '8 أيام');
  }

  getRequestDetails(requestId: string) {
    return this.detailsData[requestId];
  }
}
