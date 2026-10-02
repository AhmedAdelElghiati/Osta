import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'artisan' | 'admin';
  profileImage: string;
  location: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  artisan: {
    userId: string;
    profession: string;
    bio: string;
    experienceYears: number;
    skills: string[];
    serviceAreas: string[];
    hourlyRate: number;
    isVerified: boolean;
    rating: number;
    totalReviews: number;
  } | null;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = `${API_BASE_URL}/auth`;

  // حالة اليوزر الحالي في الذاكرة (مش localStorage). بتتحدث بعد login
  // ناجح، أو بعد ما نجيب /me، وبترجع null بعد logout.
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentUserValue(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string) {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response?.data?.user) {
            this.currentUserSubject.next(response.data.user);
          }
        }),
      );
  }

  register(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // بتتنادى عند فتح التطبيق (أو جوه الـ Guard) عشان نتأكد هل فيه
  // كوكيز صالحة من قبل كده، ونملي بيانات اليوزر من غير ما نعمل login تاني.
  fetchCurrentUser(): Observable<CurrentUser | null> {
    return this.http.get<any>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      map((response) => response?.data ?? null),
      tap((user) => this.currentUserSubject.next(user)),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      }),
    );
  }

  // الباك اند بيطلب refreshToken في الـ body (Joi) حتى لو الكوكي موجودة، لكن الكنترولر
  // بيقرا الكوكي الأول. والـ refreshToken httpOnly مش بنقدر نقراه من JS، فبنبعت قيمة
  // placeholder عشان الـ validation يعدّي، والباك اند هيستخدم الكوكي الحقيقية.
  refresh(): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/refresh`,
        { refreshToken: 'cookie' },
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          if (response?.data?.user) {
            this.currentUserSubject.next(response.data.user);
          }
        }),
      );
  }

  // تجديد واحد بس في نفس الوقت: لو كذا طلب فشلوا بـ 401 مع بعض، كلهم يستنوا
  // نفس التجديد (الباك اند بيعمل rotate للـ refresh token فمينفعش نطلبه مرتين).
  private refreshInFlight$: Observable<any> | null = null;
  refreshOnce(): Observable<any> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.refresh().pipe(
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay(1),
      );
    }
    return this.refreshInFlight$;
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<any>(
      `${this.apiUrl}/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true },
    );
  }

  logout() {
    return this.http
      .post<any>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.currentUserSubject.next(null)));
  }

  // بتتنادى من الـ interceptor لما محاولة تجديد التوكين تفشل، عشان
  // نصفّي حالة اليوزر في الفرونت من غير ما نعمل استدعاء تاني للباك اند.
  clearCurrentUser(): void {
    this.currentUserSubject.next(null);
  }
}
