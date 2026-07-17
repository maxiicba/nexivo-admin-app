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
        // Si el backend exige segundo factor todavía no hay sesión: devolvemos el
        // challenge tal cual, sin marcar al usuario como autenticado.
        if (res?.twoFactorRequired) {
          return res;
        }
        const user = res.user ?? res;
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
        return res;
      }),
    );
  }

  /** Completa el login con el segundo factor (código TOTP o enviado por email). */
  verifyTwoFactor(payload: { challengeToken: string; code: string; trustDevice?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/2fa/verify`, payload, { withCredentials: true }).pipe(
      map((res: any) => {
        const user = res.user ?? res;
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
        return res;
      }),
    );
  }

  /** Reenvía el código de verificación por email (solo aplica al método 'email'). */
  resendTwoFactorCode(challengeToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/2fa/resend`, { challengeToken }, { withCredentials: true });
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
