import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = 'http://localhost:5000/api/auth';
  private accessToken = '';

  constructor(private http: HttpClient) {
    this.accessToken = localStorage.getItem('accessToken') || '';
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
        }),
      );
  }

  getAccessToken() {
    return this.accessToken;
  }

  register(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }
}
