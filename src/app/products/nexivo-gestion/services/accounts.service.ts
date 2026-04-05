import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Account } from '../interfaces/account.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AccountsService {

    private urlApi: string;

    constructor(private httpClient: HttpClient) {
        this.urlApi = environment.managementApiUrl;
    }

    getAccounts(): Observable<Account[]> {
        return this.httpClient.get<Account[]>(`${this.urlApi}/accounts`, { withCredentials: true });
      }


    createAccountAndOwnerUserAndPoint(accountAndUser: any): Observable<any> {
        return this.httpClient.post(`${this.urlApi}/accounts`, accountAndUser,  { withCredentials: true });
    }

    updateAccount(id: string, updateAccount: any): Observable<any> {
        return this.httpClient.put(`${this.urlApi}/accounts/${id}`, updateAccount,  { withCredentials: true });
    }

    deleteAccount(id: string) {
        return this.httpClient.delete(`${this.urlApi}/accounts/${id}`, { withCredentials: true });
    }

    cancelDeletion(id: string): Observable<{ message: string }> {
        return this.httpClient.post<{ message: string }>(
            `${this.urlApi}/accounts/${id}/cancel-deletion`,
            {},
            { withCredentials: true }
        );
    }
}
