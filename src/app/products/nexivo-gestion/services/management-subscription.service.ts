import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Plan, PlanUsage, Subscription, MpAutoSubscriptionResult, PaymentStats, AllPaymentsResponse, AdminPayment, UpgradeResult, DashboardStats } from '../interfaces/subscription.interface';

@Injectable({
  providedIn: 'root'
})
export class ManagementSubscriptionService {
  private baseUrl = environment.managementApiUrl;

  constructor(private http: HttpClient) {}

  // Plans
  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.baseUrl}/subscriptions/plans`, { withCredentials: true });
  }

  getActivePlans(mode?: string): Observable<Plan[]> {
    const params: any = {};
    if (mode) params.mode = mode;
    return this.http.get<Plan[]>(`${this.baseUrl}/subscriptions/plans/active`, { params, withCredentials: true });
  }

  reorderPlans(planIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/subscriptions/plans/reorder`, { planIds }, { withCredentials: true });
  }

  createPlan(plan: Partial<Plan>): Observable<Plan> {
    return this.http.post<Plan>(`${this.baseUrl}/subscriptions/plans`, plan, { withCredentials: true });
  }

  updatePlan(id: string, plan: Partial<Plan>): Observable<Plan> {
    return this.http.put<Plan>(`${this.baseUrl}/subscriptions/plans/${id}`, plan, { withCredentials: true });
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subscriptions/plans/${id}`, { withCredentials: true });
  }

  // Subscriptions
  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.baseUrl}/subscriptions`, { withCredentials: true });
  }

  getSubscriptionByAccount(accountId: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/subscriptions/account/${accountId}`, { withCredentials: true });
  }

  createSubscription(data: { accountId: string; planId: string; billingCycle: string; freeMonths?: number }): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/subscriptions`, data, { withCredentials: true });
  }

  updateSubscription(id: string, data: any): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.baseUrl}/subscriptions/${id}`, data, { withCredentials: true });
  }

  cancelSubscription(id: string, reason?: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/subscriptions/${id}/cancel`, { reason }, { withCredentials: true });
  }

  reactivateSubscription(id: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/subscriptions/${id}/reactivate`, {}, { withCredentials: true });
  }

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/subscriptions/dashboard`, { withCredentials: true });
  }

  getAccountsWithoutSubscription(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subscriptions/accounts-without-subscription`, { withCredentials: true });
  }

  // Upgrade
  upgradePlan(planId: string): Observable<UpgradeResult> {
    return this.http.post<UpgradeResult>(`${this.baseUrl}/subscriptions/upgrade`, { planId }, { withCredentials: true });
  }

  cancelUpgrade(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/subscriptions/upgrade`, { withCredentials: true });
  }

  downgradePlan(planId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/subscriptions/downgrade`, { planId }, { withCredentials: true });
  }

  // Usage
  getUsage(accountId: string): Observable<PlanUsage> {
    return this.http.get<PlanUsage>(`${this.baseUrl}/subscriptions/usage/${accountId}`, { withCredentials: true });
  }

  // ─── MercadoPago Auto-Debit ───

  createAutoSubscription(data: {
    subscriptionId: string;
    payerEmail: string;
    planName: string;
    amount: number;
    billingCycle: 'monthly' | 'annual';
  }): Observable<MpAutoSubscriptionResult> {
    return this.http.post<MpAutoSubscriptionResult>(
      `${this.baseUrl}/mercado-pago/create-subscription`,
      data,
      { withCredentials: true },
    );
  }

  cancelAutoSubscription(preapprovalId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/mercado-pago/cancel-subscription`,
      { preapprovalId },
      { withCredentials: true },
    );
  }

  // ─── Admin Payment Endpoints ───

  getAllPayments(params?: { status?: string; page?: number; limit?: number }): Observable<AllPaymentsResponse> {
    const queryParts: string[] = [];
    if (params?.status) queryParts.push(`status=${params.status}`);
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
    return this.http.get<AllPaymentsResponse>(`${this.baseUrl}/mercado-pago/payments/all${qs}`, { withCredentials: true });
  }

  getPaymentStats(): Observable<PaymentStats> {
    return this.http.get<PaymentStats>(`${this.baseUrl}/mercado-pago/payments/stats`, { withCredentials: true });
  }
}
