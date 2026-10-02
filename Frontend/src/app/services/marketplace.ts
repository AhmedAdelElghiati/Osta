import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  API_BASE_URL,
  ARTISANS_ENDPOINT,
  CONTACT_ENDPOINT,
  MARKET_ENDPOINT,
  OFFERS_ENDPOINT,
  REVIEWS_BASE,
  USERS_ENDPOINT,
  WALLET_ENDPOINT,
} from '../core/api.config';

export interface ArtisanVm {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  profession: string;
  bio: string;
  experienceYears: number;
  skills: string[];
  serviceAreas: string[];
  hourlyRate: number;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
}

export interface OfferVm {
  _id: string;
  requestId: any;
  artisanId: any;
  price: number;
  duration: string;
  warranty: string;
  notes: string;
  items: { name: string; price: number }[];
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class Marketplace {
  constructor(private http: HttpClient) {}

  // ===== Craftsmen guide: GET /api/v1/artisans =====
  listArtisans(params: Record<string, string | number> = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<any>(ARTISANS_ENDPOINT, { params: httpParams });
  }

  getArtisan(id: string): Observable<any> {
    return this.http.get<any>(`${ARTISANS_ENDPOINT}/${id}`);
  }

  getArtisanReviews(id: string): Observable<any> {
    return this.http.get<any>(`${REVIEWS_BASE}/artisans/${id}/reviews`);
  }

  // ===== Jobs market: GET /api/v1/market =====
  listMarket(params: Record<string, string | number> = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<any>(MARKET_ENDPOINT, { params: httpParams });
  }

  marketStats(): Observable<any> {
    return this.http.get<any>(`${MARKET_ENDPOINT}/stats`);
  }

  // ===== Offers =====
  // POST /api/v1/offers (artisan) | GET /api/v1/offers/mine (customer) | GET /api/v1/offers/sent (artisan)
  createOffer(body: any): Observable<any> {
    return this.http.post<any>(OFFERS_ENDPOINT, body, { withCredentials: true });
  }

  myOffers(): Observable<any> {
    return this.http.get<any>(`${OFFERS_ENDPOINT}/mine`, { withCredentials: true });
  }

  sentOffers(): Observable<any> {
    return this.http.get<any>(`${OFFERS_ENDPOINT}/sent`, { withCredentials: true });
  }

  acceptOffer(id: string): Observable<any> {
    return this.http.post<any>(`${OFFERS_ENDPOINT}/${id}/accept`, {}, { withCredentials: true });
  }

  rejectOffer(id: string): Observable<any> {
    return this.http.post<any>(`${OFFERS_ENDPOINT}/${id}/reject`, {}, { withCredentials: true });
  }

  withdrawOffer(id: string): Observable<any> {
    return this.http.post<any>(`${OFFERS_ENDPOINT}/${id}/withdraw`, {}, { withCredentials: true });
  }

  // ===== Reviews: POST /api/v1/requests/:id/review =====
  submitReview(requestId: string, rating: number, comment = ''): Observable<any> {
    return this.http.post<any>(
      `${REVIEWS_BASE}/requests/${requestId}/review`,
      { rating, comment },
      { withCredentials: true },
    );
  }

  // ===== Profile: PATCH /api/users/me | DELETE /api/users/me =====
  updateProfile(body: any): Observable<any> {
    return this.http.patch<any>(`${USERS_ENDPOINT}/me`, body, { withCredentials: true });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete<any>(`${USERS_ENDPOINT}/me`, { withCredentials: true });
  }

  // ===== Contact: POST /api/v1/contact =====
  sendContact(body: any): Observable<any> {
    return this.http.post<any>(CONTACT_ENDPOINT, body);
  }

  myMessages(): Observable<any> {
    return this.http.get<any>(`${CONTACT_ENDPOINT}/mine`, { withCredentials: true });
  }

  // ===== Wallet: GET /api/v1/wallet | POST /deposit | POST /withdraw =====
  wallet(): Observable<any> {
    return this.http.get<any>(WALLET_ENDPOINT, { withCredentials: true });
  }

  deposit(amount: number): Observable<any> {
    return this.http.post<any>(`${WALLET_ENDPOINT}/deposit`, { amount }, { withCredentials: true });
  }

  withdraw(amount: number): Observable<any> {
    return this.http.post<any>(`${WALLET_ENDPOINT}/withdraw`, { amount }, { withCredentials: true });
  }
}
