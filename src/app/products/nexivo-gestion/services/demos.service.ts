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
    return this.http.get(`${this.adminUrl}/requests`, { params });
  }

  getRequestById(id: string): Observable<any> {
    return this.http.get(`${this.adminUrl}/requests/${id}`);
  }

  updateRequest(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.adminUrl}/requests/${id}`, data);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.adminUrl}/stats`);
  }

  // ── Availability ──

  getAvailability(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}/availability`);
  }

  createAvailability(data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/availability`, data);
  }

  updateAvailability(id: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/availability/${id}`, data);
  }

  deleteAvailability(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/availability/${id}`);
  }

  // ── Blocked slots ──

  getBlockedSlots(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}/blocked-slots`);
  }

  createBlockedSlot(data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/blocked-slots`, data);
  }

  deleteBlockedSlot(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/blocked-slots/${id}`);
  }
}
