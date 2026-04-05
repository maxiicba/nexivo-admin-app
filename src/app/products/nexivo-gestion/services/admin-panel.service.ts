import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminDashboardStats, AccountSummary, AccountDetail,
  ActivityLogResponse, AccountNote, StoreOverview,
} from '../interfaces/admin-panel.interface';

@Injectable({ providedIn: 'root' })
export class AdminPanelService {
  private baseUrl = environment.managementApiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.baseUrl}/admin/dashboard`, { withCredentials: true });
  }

  // Accounts
  getAccounts(): Observable<AccountSummary[]> {
    return this.http.get<AccountSummary[]>(`${this.baseUrl}/admin/accounts`, { withCredentials: true });
  }

  getAccountDetail(id: string): Observable<AccountDetail> {
    return this.http.get<AccountDetail>(`${this.baseUrl}/admin/accounts/${id}/detail`, { withCredentials: true });
  }

  // Activity Log
  getActivityLog(params: {
    accountId?: string;
    userId?: string;
    controller?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Observable<ActivityLogResponse> {
    const queryParts: string[] = [];
    if (params.accountId) queryParts.push(`accountId=${params.accountId}`);
    if (params.userId) queryParts.push(`userId=${params.userId}`);
    if (params.controller) queryParts.push(`controller=${params.controller}`);
    if (params.dateFrom) queryParts.push(`dateFrom=${params.dateFrom}`);
    if (params.dateTo) queryParts.push(`dateTo=${params.dateTo}`);
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);
    const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
    return this.http.get<ActivityLogResponse>(`${this.baseUrl}/activity-log${qs}`, { withCredentials: true });
  }

  getControllerList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/activity-log/controllers`, { withCredentials: true });
  }

  // Notes
  getAccountNotes(accountId: string): Observable<AccountNote[]> {
    return this.http.get<AccountNote[]>(`${this.baseUrl}/admin/accounts/${accountId}/notes`, { withCredentials: true });
  }

  createNote(accountId: string, content: string): Observable<AccountNote> {
    return this.http.post<AccountNote>(`${this.baseUrl}/admin/accounts/${accountId}/notes`, { content }, { withCredentials: true });
  }

  updateNote(noteId: string, content: string): Observable<AccountNote> {
    return this.http.put<AccountNote>(`${this.baseUrl}/admin/notes/${noteId}`, { content }, { withCredentials: true });
  }

  deleteNote(noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/notes/${noteId}`, { withCredentials: true });
  }

  // Stores
  getStoresOverview(): Observable<StoreOverview[]> {
    return this.http.get<StoreOverview[]>(`${this.baseUrl}/admin/stores`, { withCredentials: true });
  }

  getAccountStore(accountId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/stores/account/${accountId}`, { withCredentials: true });
  }
}
