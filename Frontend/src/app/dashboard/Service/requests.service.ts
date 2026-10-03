import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { MARKET_ENDPOINT } from '../../core/api.config';

export interface Request {
  id: string;
  title: string;
  client: string;
  area: string;
  dist: string;
  distKm: number;
  budget: number | null;
  posted: string;
  fresh: boolean;
  photos: number;
  when: string;
  status: 'open' | 'assigned';
  applied: boolean;
  myOfferStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | null;
  desc: string;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
  arrived$ = new Subject<Request>();

  private requestState = signal<Request[]>([]);
  get requests() { return this.requestState(); }
  set requests(value: Request[]) { this.requestState.set(value); }
  loading = false;
  error = '';

  constructor(private http: HttpClient) {
    this.load();
  }

  get openRequests() {
    return this.requests.filter((request) => request.status === 'open');
  }

  get suggested() {
    return this.openRequests.filter((request) => !request.applied).slice(0, 3);
  }

  load(params: Record<string, string | number> = {}): void {
    this.loading = true;
    this.error = '';

    let httpParams = new HttpParams().set('limit', '50');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    this.http.get<any>(MARKET_ENDPOINT, { params: httpParams, withCredentials: true }).subscribe({
      next: (response) => {
        const items = response?.data?.items ?? [];
        this.requests = items.map((item: any) => this.mapRequest(item));
        this.loading = false;
      },
      error: () => {
        this.error = 'مش قادرين نجيب الطلبات المتاحة دلوقتي.';
        this.loading = false;
      },
    });
  }

  arrive(request: Request) {
    this.requests.unshift(request);
    this.arrived$.next(request);
  }

  setApplied(id: string, applied: boolean) {
    const request = this.requests.find((item) => item.id === id);
    if (request) this.requests = this.requests.map(item => item.id === id ? { ...item, applied } : item);
  }

  markAssigned(id: string) {
    const request = this.requests.find((item) => item.id === id);
    if (request) this.requests = this.requests.map(item => item.id === id ? { ...item, status: 'assigned' } : item);
  }

  private mapRequest(raw: any): Request {
    const createdAt = raw.createdAt ? new Date(raw.createdAt) : null;
    const daysOpen = createdAt
      ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;
    const maxBudget = Number(raw.budget?.max ?? 0);
    const myOfferStatus = raw.myOfferStatus ?? null;

    return {
      id: String(raw.id),
      title: raw.title ?? '',
      client: raw.customerName || 'عميل أُسطى',
      area: [raw.area, raw.city].filter(Boolean).join('، ') || 'مصر',
      dist: [raw.area, raw.city].filter(Boolean).join('، '),
      distKm: 0,
      budget: maxBudget || null,
      posted: daysOpen === 0 ? 'النهارده' : `منذ ${daysOpen} يوم`,
      fresh: daysOpen === 0,
      photos: Number(raw.photoCount ?? 0),
      when: raw.preferredDate ? new Date(raw.preferredDate).toLocaleDateString('ar-EG') : 'بأسرع وقت',
      status: raw.status === 'OFFER_ACCEPTED' ? 'assigned' : 'open',
      applied: !!myOfferStatus && myOfferStatus !== 'WITHDRAWN',
      myOfferStatus,
      desc: raw.description ?? '',
    };
  }
}
