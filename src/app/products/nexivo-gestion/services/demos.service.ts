import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DemosService {
  private baseUrl = `${environment.managementApiUrl}/demos`;
  private adminUrl = `${environment.managementApiUrl}/demos/admin`;

  constructor(private http: HttpClient) {}

  // ── Public ──

  getAvailableDates(month: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/available-dates`, { params: { month } });
  }

  getAvailableSlots(date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/available-slots`, { params: { date } });
  }

  createRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/request`, data);
  }

  // ── Admin ──

  getRequests(params: any = {}): Observable<any> {
    return this.http.get(`${this.adminUrl}/requests`, { params, withCredentials: true });
  }

  getRequestById(id: string): Observable<any> {
    return this.http.get(`${this.adminUrl}/requests/${id}`, { withCredentials: true });
  }

  updateRequest(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.adminUrl}/requests/${id}`, data, { withCredentials: true });
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.adminUrl}/stats`, { withCredentials: true });
  }

  // ── Availability ──

  getAvailability(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}/availability`, { withCredentials: true });
  }

  createAvailability(data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/availability`, data, { withCredentials: true });
  }

  updateAvailability(id: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/availability/${id}`, data, { withCredentials: true });
  }

  deleteAvailability(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/availability/${id}`, { withCredentials: true });
  }

  // ── Blocked slots ──

  getBlockedSlots(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}/blocked-slots`, { withCredentials: true });
  }

  createBlockedSlot(data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/blocked-slots`, data, { withCredentials: true });
  }

  deleteBlockedSlot(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/blocked-slots/${id}`, { withCredentials: true });
  }
}
