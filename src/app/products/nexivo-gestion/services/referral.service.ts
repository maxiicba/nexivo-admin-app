import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Referrer,
  ReferrerPayload,
  ReferralCommission,
  PaginatedCommissions,
  ReferralDashboardStats,
  ReferralCodeValidation,
} from '../interfaces/referral.interface';

/**
 * Únicos campos que el `UpdateReferrerDto` de la API acepta. El ValidationPipe
 * global corre con `forbidNonWhitelisted: true`, así que mandar el referente
 * entero (id, totalEarnings, referrals, createdAt…) devuelve 400.
 */
const WRITABLE_FIELDS: (keyof ReferrerPayload)[] = [
  'name', 'email', 'phone', 'code', 'discountPercentage', 'commissionType', 'commissionValue', 'status',
];

const NUMERIC_FIELDS: (keyof ReferrerPayload)[] = ['discountPercentage', 'commissionValue'];

@Injectable({
  providedIn: 'root'
})
export class ReferralService {
  private baseUrl = `${environment.managementApiUrl}/referrals`;

  constructor(private http: HttpClient) {}

  /**
   * Recorta el objeto a los campos escribibles y castea los decimales, que
   * Postgres devuelve como string ("10.00") y `@IsNumber()` rechazaría.
   */
  private toPayload(data: Partial<Referrer>): ReferrerPayload {
    const payload: ReferrerPayload = {};
    for (const field of WRITABLE_FIELDS) {
      const value = (data as any)[field];
      if (value === undefined || value === null) continue;
      if (NUMERIC_FIELDS.includes(field)) {
        const num = Number(value);
        if (!Number.isNaN(num)) (payload as any)[field] = num;
        continue;
      }
      if (typeof value === 'string' && value.trim() === '') continue;
      (payload as any)[field] = typeof value === 'string' ? value.trim() : value;
    }
    if (payload.code) payload.code = payload.code.toUpperCase();
    return payload;
  }

  // Referrer CRUD
  createReferrer(data: Partial<Referrer>): Observable<Referrer> {
    return this.http.post<Referrer>(`${this.baseUrl}/referrers`, this.toPayload(data), { withCredentials: true });
  }

  getReferrers(): Observable<Referrer[]> {
    return this.http.get<Referrer[]>(`${this.baseUrl}/referrers`, { withCredentials: true });
  }

  getReferrer(id: string): Observable<Referrer> {
    return this.http.get<Referrer>(`${this.baseUrl}/referrers/${id}`, { withCredentials: true });
  }

  updateReferrer(id: string, data: Partial<Referrer>): Observable<Referrer> {
    return this.http.put<Referrer>(`${this.baseUrl}/referrers/${id}`, this.toPayload(data), { withCredentials: true });
  }

  toggleStatus(id: string): Observable<Referrer> {
    return this.http.patch<Referrer>(`${this.baseUrl}/referrers/${id}/status`, {}, { withCredentials: true });
  }

  // Commissions
  getCommissionsByReferrer(referrerId: string): Observable<ReferralCommission[]> {
    return this.http.get<ReferralCommission[]>(`${this.baseUrl}/referrers/${referrerId}/commissions`, { withCredentials: true });
  }

  getAllCommissions(status?: string, page = 1, limit = 50): Observable<PaginatedCommissions> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedCommissions>(`${this.baseUrl}/commissions`, { withCredentials: true, params });
  }

  markCommissionsPaid(ids: string[]): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(`${this.baseUrl}/commissions/mark-paid`, { ids }, { withCredentials: true });
  }

  // Dashboard
  getDashboardStats(): Observable<ReferralDashboardStats> {
    return this.http.get<ReferralDashboardStats>(`${this.baseUrl}/dashboard`, { withCredentials: true });
  }

  // Public — el código se normaliza acá porque el input solo lo muestra en
  // mayúsculas por CSS y la búsqueda en Postgres es case-sensitive.
  validateCode(code: string): Observable<ReferralCodeValidation> {
    return this.http.get<ReferralCodeValidation>(`${this.baseUrl}/validate-code/${encodeURIComponent(code.trim().toUpperCase())}`);
  }
}
