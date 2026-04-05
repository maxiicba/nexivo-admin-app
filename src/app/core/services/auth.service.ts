import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.managementApiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private checkStatus$: Observable<any> | null = null;

  constructor(private http: HttpClient) {}

  getCurrentUser() { return this.currentUserSubject.value; }
  isLoggedIn() { return this.isAuthenticatedSubject.value; }

  checkAuthStatus(): Observable<any> {
    if (!this.checkStatus$) {
      this.checkStatus$ = this.http.get(`${this.baseUrl}/auth/check-status`, { withCredentials: true }).pipe(
        map((user: any) => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(!!user);
          return user;
        }),
        catchError(() => {
          this.isAuthenticatedSubject.next(false);
          this.currentUserSubject.next(null);
          return of(null);
        }),
        finalize(() => { this.checkStatus$ = null; }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.checkStatus$;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credentials, { withCredentials: true }).pipe(
      map((res: any) => {
        const user = res.user ?? res;
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
        return res;
      }),
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      map(() => {
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
      }),
      catchError(() => {
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
        return of(null);
      }),
    );
  }
}
