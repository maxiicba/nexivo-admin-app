import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NexivoTurnosAdminService {
  private base = `${environment.turnosApiUrl}/subscriptions`;
  private businessesBase = `${environment.turnosApiUrl}/businesses`;

  constructor(private http: HttpClient) {}

  // ── Subscriptions ──────────────────────────────────────────────────────────

  getAllSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/all`, { withCredentials: true });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/stats`, { withCredentials: true });
  }

  updateSubscription(id: string, data: Partial<{ planId: string; billingCycle: string; currentPrice: number }>): Observable<any> {
    return this.http.patch<any>(`${this.base}/admin/${id}/plan`, data, { withCredentials: true });
  }

  cancelSubscription(id: string, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/${id}/cancel`, { reason }, { withCredentials: true });
  }

  // ── Plans ──────────────────────────────────────────────────────────────────
  // Routes under @Controller('subscriptions'): /api/subscriptions/plans/...

  getAllPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/plans/admin`, { withCredentials: true });
  }

  createPlan(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/plans`, data, { withCredentials: true });
  }

  updatePlan(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/plans/${id}`, data, { withCredentials: true });
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/plans/${id}`, { withCredentials: true });
  }

  // ── Plan whitelist ─────────────────────────────────────────────────────────

  listWhitelist(planId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/plans/${planId}/whitelist`, { withCredentials: true });
  }

  addToWhitelist(planId: string, businessId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/plans/${planId}/whitelist`, { businessId }, { withCredentials: true });
  }

  removeFromWhitelist(planId: string, businessId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/plans/${planId}/whitelist/${businessId}`, { withCredentials: true });
  }

  // ── Business search ────────────────────────────────────────────────────────

  searchBusinesses(q: string): Observable<{ id: string; name: string; slug: string }[]> {
    return this.http.get<{ id: string; name: string; slug: string }[]>(
      `${this.businessesBase}/admin/search`,
      { params: { q }, withCredentials: true },
    );
  }
}
