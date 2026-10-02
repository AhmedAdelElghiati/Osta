import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${API_BASE_URL}/admin`;

  constructor(private http: HttpClient) {}

  overview(): Observable<any> {
    return this.http.get<any>(`${this.base}/overview`, { withCredentials: true });
  }

  users(search = '', role = ''): Observable<any> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());
    if (role) params = params.set('role', role);
    return this.http.get<any>(`${this.base}/users`, { params, withCredentials: true });
  }

  toggleUser(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/users/${id}/toggle-active`, {}, { withCredentials: true });
  }

  artisans(): Observable<any> {
    return this.http.get<any>(`${this.base}/artisans`, { withCredentials: true });
  }

  verifyArtisan(id: string, isVerified: boolean): Observable<any> {
    return this.http.patch<any>(`${this.base}/artisans/${id}/verify`, { isVerified }, { withCredentials: true });
  }

  contact(): Observable<any> {
    return this.http.get<any>(`${this.base}/contact`, { withCredentials: true });
  }

  updateContact(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/contact/${id}`, { status }, { withCredentials: true });
  }
}