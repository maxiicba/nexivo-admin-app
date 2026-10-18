import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type BroadcastTarget = 'all' | 'status' | 'businesses' | 'emails';

export interface BroadcastAudience {
  target: BroadcastTarget;
  statuses?: string[];
  businessIds?: string[];
  emails?: string[];
}

export interface SendBroadcast extends BroadcastAudience {
  title: string;
  body?: string;
  link?: string;
  inbox: boolean;
  push: boolean;
}

export interface BroadcastPreview {
  businesses: number;
  devices: number;
  /** false = turnos-api sin credenciales de Firebase: el push no sale. */
  pushEnabled: boolean;
}

export interface AdminBroadcast {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  audience: BroadcastAudience;
  viaInbox: boolean;
  viaPush: boolean;
  businessCount: number;
  pushSent: number;
  pushFailed: number;
  sentBy: string | null;
  createdAt: string;
}

/** Mensajes de Nexivo a los negocios de Turnos → turnos-api `/admin/notifications`. */
@Injectable({ providedIn: 'root' })
export class TurnosNotificationsService {
  private base = `${environment.turnosApiUrl}/admin/notifications`;

  constructor(private http: HttpClient) {}

  preview(audience: BroadcastAudience): Observable<BroadcastPreview> {
    return this.http.post<BroadcastPreview>(`${this.base}/preview`, audience, { withCredentials: true });
  }

  send(body: SendBroadcast): Observable<AdminBroadcast> {
    return this.http.post<AdminBroadcast>(`${this.base}/send`, body, { withCredentials: true });
  }

  history(page = 1): Observable<{ items: AdminBroadcast[]; total: number; page: number; pageSize: number }> {
    return this.http.get<any>(`${this.base}/history`, { params: { page }, withCredentials: true });
  }
}
