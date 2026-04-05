import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NexivoGestionAdminService {
  private base = `${environment.managementApiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  getAllSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin`, { withCredentials: true });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/stats`, { withCredentials: true });
  }

  updateSubscription(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/admin/${id}`, data, { withCredentials: true });
  }

  cancelSubscription(id: string, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/${id}/cancel`, { reason }, { withCredentials: true });
  }

  getAllPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.managementApiUrl}/plans`, { withCredentials: true });
  }

  createPlan(data: any): Observable<any> {
    return this.http.post<any>(`${environment.managementApiUrl}/plans`, data, { withCredentials: true });
  }

  updatePlan(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${environment.managementApiUrl}/plans/${id}`, data, { withCredentials: true });
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.managementApiUrl}/plans/${id}`, { withCredentials: true });
  }
}
