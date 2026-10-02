import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-home',
  imports: [CommonModule],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome {
  @Input() userName = '';
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
  @Output() acceptOfferEvent = new EventEmitter<string>();

  get firstName(): string {
    return (this.userName || '').trim().split(/\s+/)[0] || '';
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  get maxOfferPrice(): number {
    return this.kitchenOffers.reduce(
      (max, offer) => Math.max(max, Number(offer.price) || 0),
      0,
    );
  }

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
    id: '',
    name: '',
    price: 0,
    duration: '',
  };

  openAccept(id: string, name: string, price: number, duration: string) {
    this.selectedOffer = {
      id,
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
    if (this.selectedOffer.id) {
      this.acceptOfferEvent.emit(this.selectedOffer.id);
    }
    this.closeAcceptModal();
  }

  getRequestDetails(requestId: string) {
    return this.detailsData[requestId];
  }
}
