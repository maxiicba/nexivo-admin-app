import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DeviceKind } from '../utils/device-label.util';

/** Datos de la sesión abierta en otro dispositivo que este login va a cerrar. */
export interface ActiveSessionInfo {
  userAgent: string | null;
  ip: string | null;
  startedAt: string;
  lastActiveAt: string;
  /**
   * Celular o computadora. El cupo es UNA sesión por tipo, así que el choque
   * siempre es contra una del MISMO tipo. Opcional: una API anterior a este
   * campo no lo manda.
   */
  deviceKind?: DeviceKind | null;
}

/** Respuesta de un login válido que quedó FRENADO por una sesión abierta. */
export interface SessionConflictResponse {
  sessionConflict: true;
  takeoverToken: string;
  activeSession: ActiveSessionInfo;
}

/**
 * ¿La respuesta es un login frenado y no un login exitoso?
 *
 * Sin este chequeo, `res.user ?? res` toma el objeto de conflicto como si fuera
 * el usuario: la app se cree autenticada SIN cookie y todo rebota con 401.
 */
export function isSessionConflict(res: any): res is SessionConflictResponse {
  return res?.sessionConflict === true && typeof res?.takeoverToken === 'string';
}

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
      map((res: any) => this.applyLoginResponse(res)),
    );
  }

  /**
   * Confirma el cierre de la sesión abierta en otro dispositivo y completa el
   * login frenado. No repite credenciales: el `takeoverToken` ya prueba un
   * login válido de hace menos de 5 minutos.
   */
  confirmSessionTakeover(takeoverToken: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/auth/session/takeover`,
      { takeoverToken },
      { withCredentials: true },
    ).pipe(
      map((res: any) => this.applyLoginResponse(res)),
    );
  }

  /**
   * Hidrata la sesión SOLO si el backend realmente la emitió. Un login frenado
   * (sesión abierta en otro dispositivo) llega sin `user` y sin cookie.
   */
  private applyLoginResponse(res: any): any {
    if (isSessionConflict(res)) {
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
      return res;
    }
    const user = res.user ?? res;
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(!!user);
    return res;
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
