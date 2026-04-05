import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NexivoGestionAdminService {
  private base = `${environment.managementApiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  // ── Subscriptions ──────────────────────────────────────────────────────────
  // GET /api/subscriptions          → findAllSubscriptions() (superAdmin)
  // PUT /api/subscriptions/:id      → updateSubscription()
  // POST /api/subscriptions/:id/cancel → cancelSubscription()

  getAllSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}`, { withCredentials: true });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/stats`, { withCredentials: true });
  }

  updateSubscription(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, data, { withCredentials: true });
  }

  cancelSubscription(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/cancel`, { reason }, { withCredentials: true });
  }

  // ── Plans ──────────────────────────────────────────────────────────────────
  // Routes under @Controller('subscriptions'): /api/subscriptions/plans/...
  // NOTE: management-api uses PUT for plan updates (not PATCH)

  getAllPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/plans`, { withCredentials: true });
  }

  createPlan(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/plans`, data, { withCredentials: true });
  }

  updatePlan(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/plans/${id}`, data, { withCredentials: true });
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/plans/${id}`, { withCredentials: true });
  }
}
