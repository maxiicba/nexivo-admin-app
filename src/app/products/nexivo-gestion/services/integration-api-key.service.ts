import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface IntegrationApiKey {
  id: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  salesPoint: { id: string; name: string };
  user: { id: string };
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  plainKey: string;
}

export interface ActivationKey {
  id: string;
  key: string;
  isActive: boolean;
  machineFingerprint: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  salesPoint: { id: string; name: string };
}

export interface CreateActivationKeyResponse {
  id: string;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class IntegrationApiKeyService {
  private url = `${environment.managementApiUrl}/integration-api-keys`;

  constructor(private http: HttpClient) {}

  getByAccount(accountId: string): Observable<IntegrationApiKey[]> {
    return this.http.get<IntegrationApiKey[]>(`${this.url}/account/${accountId}`, { withCredentials: true });
  }

  create(dto: { name: string; accountId: string; salesPointId: string; userId: string }): Observable<CreateApiKeyResponse> {
    return this.http.post<CreateApiKeyResponse>(this.url, dto, { withCredentials: true });
  }

  update(id: string, dto: { isActive: boolean }): Observable<any> {
    return this.http.patch(`${this.url}/${id}`, dto, { withCredentials: true });
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}`, { withCredentials: true });
  }

  // --- Activation Keys ---

  getActivationKeys(apiKeyId: string): Observable<ActivationKey[]> {
    return this.http.get<ActivationKey[]>(`${this.url}/${apiKeyId}/activation-keys`, { withCredentials: true });
  }

  createActivationKey(apiKeyId: string, dto: { accountId: string; salesPointId: string; expiresAt?: string }): Observable<CreateActivationKeyResponse> {
    return this.http.post<CreateActivationKeyResponse>(`${this.url}/${apiKeyId}/activation-keys`, dto, { withCredentials: true });
  }

  revokeActivationKey(id: string): Observable<any> {
    return this.http.patch(`${this.url}/activation-keys/${id}/revoke`, {}, { withCredentials: true });
  }

  removeActivationKey(id: string): Observable<any> {
    return this.http.delete(`${this.url}/activation-keys/${id}`, { withCredentials: true });
  }
}
