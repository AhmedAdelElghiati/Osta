import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Job, JobsService } from './jobs.service';
import { RequestsService } from './requests.service';

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
  timer?: any;
}

@Injectable({ providedIn: 'root' })
export class OffersService {

  private jobsService = inject(JobsService);
  private requests = inject(RequestsService);

  private seq = 79;

  accepted$ = new Subject<{ offer: Offer; job: Job }>();
  withdrawn$ = new Subject<Offer>();

  offers: Offer[] = [
    {
      id: 'O-78', reqId: 'C105',
      title: 'معالجة ضغط مياه ضعيف بالعمارة',
      client: 'إدارة عمارة 12', area: 'طنطا — القسطاني',
      price: 2400, duration: 'يوم واحد', warranty: '3 شهور',
      status: 'pending', sent: 'قبل 5 ساعات'
    },
    {
      id: 'O-77', reqId: 'C102',
      title: 'تركيب سخان غاز + تمديدات الحمام',
      client: 'أ. كريم فؤاد', area: 'طنطا — شارع النكلا',
      price: 4100, duration: 'يوم واحد', warranty: '6 شهور',
      status: 'pending', sent: 'قبل ساعتين'
    },
    {
      id: 'O-76', reqId: 'C104',
      title: 'تغيير مواسير المياه (حديد لـ PPR)',
      client: 'أ. سامح لطفي', area: 'المحلة الكبرى',
      price: 8700, duration: '4 أيام', warranty: 'سنة',
      status: 'rejected', sent: 'قبل يومين'
    },
    {
      id: 'O-75', reqId: 'C101x',
      title: 'صيانة سباكة ومحابس الحمام',
      client: 'أ. أحمد عثمان', area: 'طنطا',
      price: 1400, duration: 'يومين', warranty: '6 شهور',
      status: 'accepted', sent: 'قبل 4 أيام', jobId: 'J-2411'
    }
  ];

  get pendingOffers() {
    return this.offers.filter(o => o.status === 'pending');
  }

  submit(data: Omit<Offer, 'id' | 'status' | 'sent' | 'timer' | 'jobId'>) {
    const offer: Offer = { ...data, id: 'O-' + this.seq++, status: 'pending', sent: 'الآن' };
    this.offers.unshift(offer);
    this.requests.setApplied(data.reqId, true);

    // محاكاة قبول العميل بعد 14 ثانية
    offer.timer = setTimeout(() => this.clientAccepts(offer.id), 14000);
    return offer;
  }

  withdraw(id: string) {
    const offer = this.offers.find(o => o.id === id);
    if (!offer || offer.status !== 'pending') return;

    clearTimeout(offer.timer);
    offer.timer = null;
    offer.status = 'withdrawn';
    this.requests.setApplied(offer.reqId, false);
    this.withdrawn$.next(offer);
  }

  private clientAccepts(id: string) {
    const offer = this.offers.find(o => o.id === id);
    if (!offer || offer.status !== 'pending') return;

    const job = this.jobsService.addFromOffer(offer);

    offer.status = 'accepted';
    offer.jobId = job.id;
    offer.timer = null;
    this.requests.markAssigned(offer.reqId);

    this.accepted$.next({ offer, job });
  }
}