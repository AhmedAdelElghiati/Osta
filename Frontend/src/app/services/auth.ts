import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of, switchMap, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'artisan' | 'admin';
  location: string;
  profileImage?: string;
  artisan?: any;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = `${API_BASE_URL}/auth`;
  private accessToken = '';
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.accessToken = localStorage.getItem('accessToken') || '';
  }

  get currentUserValue() {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string) {
    return this.http
      .post<any>(
        `${this.apiUrl}/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => {
          this.accessToken = response.data.accessToken;
          localStorage.setItem('accessToken', this.accessToken);
          this.currentUserSubject.next(response.data.user);
        }),
      );
  }

  getAccessToken() {
    return this.accessToken;
  }

  register(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  fetchCurrentUser() {
    const request = () =>
      this.http.get<any>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
        map((response) => response.data as CurrentUser),
        tap((user) => this.currentUserSubject.next(user)),
      );

    return request().pipe(
      catchError((error) => {
        if (error?.status !== 401) {
          this.clearCurrentUser();
          return of(null);
        }

        return this.http.post<any>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
          tap((response) => {
            this.accessToken = response.data.accessToken;
            localStorage.setItem('accessToken', this.accessToken);
          }),
          switchMap(() => request()),
          catchError(() => {
            this.clearCurrentUser();
            return of(null);
          }),
        );
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<any>(
      `${this.apiUrl}/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true },
    );
  }

  logout() {
    return this.http.post<any>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearCurrentUser()),
    );
  }

  clearCurrentUser() {
    this.accessToken = '';
    localStorage.removeItem('accessToken');
    this.currentUserSubject.next(null);
  }
}
