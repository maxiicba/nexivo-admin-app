import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Referrer, ReferralCommission, ReferralDashboardStats, ReferralCodeValidation } from '../interfaces/referral.interface';

@Injectable({
  providedIn: 'root'
})
export class ReferralService {
  private baseUrl = `${environment.managementApiUrl}/referrals`;

  constructor(private http: HttpClient) {}

  // Referrer CRUD
  createReferrer(data: Partial<Referrer>): Observable<Referrer> {
    return this.http.post<Referrer>(`${this.baseUrl}/referrers`, data, { withCredentials: true });
  }

  getReferrers(): Observable<Referrer[]> {
    return this.http.get<Referrer[]>(`${this.baseUrl}/referrers`, { withCredentials: true });
  }

  getReferrer(id: string): Observable<Referrer> {
    return this.http.get<Referrer>(`${this.baseUrl}/referrers/${id}`, { withCredentials: true });
  }

  updateReferrer(id: string, data: Partial<Referrer>): Observable<Referrer> {
    return this.http.put<Referrer>(`${this.baseUrl}/referrers/${id}`, data, { withCredentials: true });
  }

  toggleStatus(id: string): Observable<Referrer> {
    return this.http.patch<Referrer>(`${this.baseUrl}/referrers/${id}/status`, {}, { withCredentials: true });
  }

  // Commissions
  getCommissionsByReferrer(referrerId: string): Observable<ReferralCommission[]> {
    return this.http.get<ReferralCommission[]>(`${this.baseUrl}/referrers/${referrerId}/commissions`, { withCredentials: true });
  }

  getAllCommissions(status?: string): Observable<ReferralCommission[]> {
    const params: any = {};
    if (status) params.status = status;
    return this.http.get<ReferralCommission[]>(`${this.baseUrl}/commissions`, { withCredentials: true, params });
  }

  markCommissionsPaid(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/commissions/mark-paid`, { ids }, { withCredentials: true });
  }

  // Dashboard
  getDashboardStats(): Observable<ReferralDashboardStats> {
    return this.http.get<ReferralDashboardStats>(`${this.baseUrl}/dashboard`, { withCredentials: true });
  }

  // Public
  validateCode(code: string): Observable<ReferralCodeValidation> {
    return this.http.get<ReferralCodeValidation>(`${this.baseUrl}/validate-code/${code}`);
  }
}
