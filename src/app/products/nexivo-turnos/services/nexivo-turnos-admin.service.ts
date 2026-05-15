import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BulkResult {
  success: string[];
  failed: { id: string; error: string }[];
}

@Injectable({ providedIn: 'root' })
export class NexivoTurnosAdminService {
  private base = `${environment.turnosApiUrl}/subscriptions`;
  private businessesBase = `${environment.turnosApiUrl}/businesses`;

  constructor(private http: HttpClient) {}

  // ── Subscriptions ──────────────────────────────────────────────────────────

  getAllSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/all`, { withCredentials: true });
  }

  listWithFilters(params: {
    status?: string; planId?: string; mpStatus?: string; search?: string;
    expiringInDays?: number; page?: number; pageSize?: number;
    sortBy?: string; sortDir?: 'ASC' | 'DESC';
  }): Observable<{ items: any[]; total: number; page: number; pageSize: number }> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<any>(`${this.base}/admin/list`, { params: httpParams, withCredentials: true });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/stats`, { withCredentials: true });
  }

  updateSubscription(id: string, data: Partial<{ planId: string; billingCycle: string; currentPrice: number }>): Observable<any> {
    return this.http.patch<any>(`${this.base}/admin/${id}/plan`, data, { withCredentials: true });
  }

  cancelSubscription(id: string, reason: string, immediate = false): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/${id}/cancel`, { reason, immediate }, { withCredentials: true });
  }

  // ── Detail / payments / audit / notes / credits ───────────────────────────

  getDetail(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/${id}/detail`, { withCredentials: true });
  }

  getPayments(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/${id}/payments`, { withCredentials: true });
  }

  getAudit(id: string, params: {
    actor?: string; actions?: string; excludeActions?: string;
    page?: number; pageSize?: number;
  } = {}): Observable<{ items: any[]; total: number; page: number; pageSize: number }> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<any>(`${this.base}/admin/${id}/audit`, { params: httpParams, withCredentials: true });
  }

  getNotes(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/${id}/notes`, { withCredentials: true });
  }

  getCredits(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/${id}/credits`, { withCredentials: true });
  }

  // ── Status / reactivate ───────────────────────────────────────────────────

  changeStatus(id: string, body: { status: string; reason: string }): Observable<any> {
    return this.http.patch<any>(`${this.base}/admin/${id}/status`, body, { withCredentials: true });
  }

  reactivate(id: string): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/${id}/reactivate`, {}, { withCredentials: true });
  }

  // ── Comp / credits / notes ────────────────────────────────────────────────

  grantComp(id: string, body: { months?: number; days?: number; reason: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/${id}/grant-comp`, body, { withCredentials: true });
  }

  applyCredit(id: string, body: { amount: number; type: 'fixed' | 'percentage'; reason: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/${id}/credits`, body, { withCredentials: true });
  }

  deleteCredit(creditId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/credits/${creditId}`, { withCredentials: true });
  }

  createNote(id: string, body: string): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/${id}/notes`, { body }, { withCredentials: true });
  }

  updateNote(noteId: string, body: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/admin/notes/${noteId}`, { body }, { withCredentials: true });
  }

  deleteNote(noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/notes/${noteId}`, { withCredentials: true });
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  reconcilePayments(id: string): Observable<{ recovered: number }> {
    return this.http.post<any>(`${this.base}/admin/${id}/reconcile-payments`, {}, { withCredentials: true });
  }

  generateManualCheckoutLink(id: string): Observable<{ checkoutUrl: string; preferenceId: string }> {
    return this.http.post<any>(`${this.base}/admin/${id}/manual-checkout-link`, {}, { withCredentials: true });
  }

  markRefunded(paymentId: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.base}/admin/payments/${paymentId}/mark-refunded`, { reason }, { withCredentials: true });
  }

  // ── Bulk ──────────────────────────────────────────────────────────────────

  bulkGrantComp(subscriptionIds: string[], months: number, reason: string): Observable<BulkResult> {
    return this.http.post<BulkResult>(`${this.base}/admin/bulk/grant-comp`, { subscriptionIds, months, reason }, { withCredentials: true });
  }

  bulkChangeStatus(subscriptionIds: string[], status: string, reason: string): Observable<BulkResult> {
    return this.http.post<BulkResult>(`${this.base}/admin/bulk/change-status`, { subscriptionIds, status, reason }, { withCredentials: true });
  }

  bulkNotify(subscriptionIds: string[], channel: 'email' | 'whatsapp', template: string, customMessage?: string): Observable<BulkResult> {
    return this.http.post<BulkResult>(`${this.base}/admin/bulk/notify`, { subscriptionIds, channel, template, customMessage }, { withCredentials: true });
  }

  // ── Metrics ───────────────────────────────────────────────────────────────

  getMetrics(from: string, to: string): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/metrics`, { params: { from, to }, withCredentials: true });
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

  // ── Impersonation ─────────────────────────────────────────────────────────

  startImpersonation(targetUserId: string): Observable<{
    token: string;
    sessionId: string;
    target: { id: string; email: string | null; businessName: string | null };
  }> {
    return this.http.post<any>(
      `${environment.turnosApiUrl}/auth/impersonate/start`,
      { targetUserId },
      { withCredentials: true },
    );
  }

  // ── Business search ────────────────────────────────────────────────────────

  searchBusinesses(q: string): Observable<{ id: string; name: string; slug: string }[]> {
    return this.http.get<{ id: string; name: string; slug: string }[]>(
      `${this.businessesBase}/admin/search`,
      { params: { q }, withCredentials: true },
    );
  }
}
