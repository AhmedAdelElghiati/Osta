import { Injectable, inject, signal } from '@angular/core';
import { Subject, map } from 'rxjs';
import { Marketplace } from '../../services/marketplace';
import { RequestsService } from './requests.service';
import { JobsService } from './jobs.service';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Offer {
  id: string;
  reqId: string;
  title: string;
  client: string;
  area: string;
  price: number;
  duration: string;
  warranty: string;
  status: OfferStatus;
  sent: string;
  jobId?: string;
  rows?: [string, number][];
  msg?: string;
}

@Injectable({ providedIn: 'root' })
export class OffersService {
  private api = inject(Marketplace);
  private requests = inject(RequestsService);
  private jobs = inject(JobsService);

  accepted$ = new Subject<{ offer: Offer }>();
  withdrawn$ = new Subject<Offer>();

  private offerState = signal<Offer[]>([]);
  get offers() { return this.offerState(); }
  set offers(value: Offer[]) { this.offerState.set(value); }
  loading = false;
  error = '';

  constructor() {
    this.loadSent();
  }

  get pendingOffers() {
    return this.offers.filter((offer) => offer.status === 'pending');
  }

  loadSent(): void {
    this.loading = true;
    this.error = '';
    this.api.sentOffers().subscribe({
      next: (response) => {
        const items = response?.data ?? [];
        this.offers = items.map((item: any) => this.mapOffer(item));
        this.syncMarketFromOffers();
        if (this.offers.some((offer) => offer.status === 'accepted')) {
          this.jobs.load();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'مش قادرين نجيب عروضك دلوقتي.';
        this.loading = false;
      },
    });
  }

  submit(data: Omit<Offer, 'id' | 'status' | 'sent' | 'jobId'>) {
    const body = {
      requestId: data.reqId,
      price: data.price,
      duration: data.duration,
      warranty: data.warranty,
      notes: data.msg || '',
      items: (data.rows || []).map(([name, price]) => ({ name, price })),
    };

    return this.api.createOffer(body).pipe(
      map((response) => {
        const offer = this.mapOffer(response.data);
        this.offers = [offer, ...this.offers];
        this.requests.setApplied(data.reqId, true);
        this.requests.load();
        return offer;
      }),
    );
  }

  withdraw(id: string) {
    const offer = this.offers.find((item) => item.id === id);
    if (!offer || offer.status !== 'pending') return;

    this.api.withdrawOffer(id).subscribe({
      next: (response) => {
        const updated = this.mapOffer(response.data);
        this.offers = this.offers.map(item => item.id === id ? updated : item);
        this.requests.setApplied(offer.reqId, false);
        this.requests.load();
        this.withdrawn$.next(offer);
      },
      error: () => {
        this.error = 'تعذر سحب العرض دلوقتي.';
      },
    });
  }

  private mapOffer(raw: any): Offer {
    const request = raw.requestId && typeof raw.requestId === 'object' ? raw.requestId : {};
    const status = String(raw.status || 'PENDING').toLowerCase() as OfferStatus;

    return {
      id: String(raw._id ?? raw.id),
      reqId: String(request._id ?? raw.requestId ?? ''),
      title: request.title ?? 'طلب خدمة',
      client: request.customerId?.name ?? 'عميل أُسطى',
      area: [request.location?.area, request.location?.city].filter(Boolean).join('، '),
      price: Number(raw.price ?? 0),
      duration: raw.duration ?? '',
      warranty: raw.warranty ?? '',
      status,
      jobId: raw.job?._id ? String(raw.job._id) : undefined,
      sent: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('ar-EG') : 'الآن',
      rows: Array.isArray(raw.items) ? raw.items.map((item: any) => [item.name, Number(item.price)] as [string, number]) : [],
      msg: raw.notes ?? '',
    };
  }

  private syncMarketFromOffers(): void {
    this.offers.forEach((offer) => {
      this.requests.setApplied(offer.reqId, offer.status === 'pending' || offer.status === 'accepted');
      if (offer.status === 'accepted') this.requests.markAssigned(offer.reqId);
    });
  }
}

