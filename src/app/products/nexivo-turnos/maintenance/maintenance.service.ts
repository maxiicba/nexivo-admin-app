import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MaintenanceConfig {
  id: string;
  isEnabled: boolean;
  bypassCode: string | null;
  message: string | null;
  enabledAt: string | null;
  enabledBy: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private base = `${environment.turnosApiUrl}/maintenance`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<MaintenanceConfig> {
    return this.http.get<MaintenanceConfig>(this.base, { withCredentials: true });
  }

  enable(): Observable<MaintenanceConfig> {
    return this.http.post<MaintenanceConfig>(`${this.base}/enable`, {}, { withCredentials: true });
  }

  disable(): Observable<MaintenanceConfig> {
    return this.http.post<MaintenanceConfig>(`${this.base}/disable`, {}, { withCredentials: true });
  }

  updateMessage(message: string): Observable<MaintenanceConfig> {
    return this.http.patch<MaintenanceConfig>(this.base, { message }, { withCredentials: true });
  }

  regenerateCode(): Observable<MaintenanceConfig> {
    return this.http.patch<MaintenanceConfig>(this.base, { regenerateCode: true }, { withCredentials: true });
  }
}
