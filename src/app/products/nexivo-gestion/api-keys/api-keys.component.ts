import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';

import { environment } from '../../../../environments/environment';
import { AccountsService } from '../services/accounts.service';
import { IntegrationApiKeyService, IntegrationApiKey, ActivationKey } from '../services/integration-api-key.service';

@Component({
  standalone: true,
  selector: 'app-api-keys',
  templateUrl: './api-keys.component.html',
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, DialogModule, DropdownModule,
    InputTextModule, InputSwitchModule, ToastModule, TagModule,
    TooltipModule, ConfirmDialogModule, SkeletonModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class ApiKeysComponent implements OnInit {
  accounts: any[] = [];
  selectedAccountId: string | null = null;

  salesPoints: any[] = [];
  users: any[] = [];

  apiKeys: IntegrationApiKey[] = [];
  loading = false;

  // Create dialog
  createDialog = false;
  creating = false;
  newKey = { name: '', salesPointId: '', userId: '' };

  // Show key dialog (after creation)
  showKeyDialog = false;
  createdPlainKey = '';
  createdSalesPointId = '';

  // Activation keys
  activationKeysDialog = false;
  activationKeys: ActivationKey[] = [];
  loadingActivationKeys = false;
  selectedApiKeyForActivation: IntegrationApiKey | null = null;
  creatingActivation = false;

  // Show activation key dialog (after creation)
  showActivationKeyDialog = false;
  createdActivationKey = '';

  constructor(
    private apiKeyService: IntegrationApiKeyService,
    private accountsService: AccountsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.accountsService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts.map((a: any) => ({ label: a.name, value: a.id }));
      },
    });
  }

  onAccountChange(): void {
    if (!this.selectedAccountId) {
      this.apiKeys = [];
      this.salesPoints = [];
      this.users = [];
      return;
    }
    this.loadApiKeys();
    this.loadSalesPoints();
    this.loadUsers();
  }

  loadApiKeys(): void {
    this.loading = true;
    this.apiKeyService.getByAccount(this.selectedAccountId!).subscribe({
      next: (keys) => {
        this.apiKeys = keys;
        this.loading = false;
      },
      error: () => {
        this.apiKeys = [];
        this.loading = false;
      },
    });
  }

  loadSalesPoints(): void {
    this.http.get<any[]>(`${environment.managementApiUrl}/sale-point/${this.selectedAccountId}`, { withCredentials: true }).subscribe({
      next: (sp) => {
        this.salesPoints = sp.map((s: any) => ({ label: s.name, value: s.id }));
      },
    });
  }

  loadUsers(): void {
    this.http.get<any[]>(`${environment.managementApiUrl}/user/account/${this.selectedAccountId}`, { withCredentials: true }).subscribe({
      next: (users) => {
        this.users = users.map((u: any) => ({
          label: `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim(),
          value: u.id,
        }));
      },
    });
  }

  // --- Create ---
  openCreateDialog(): void {
    this.newKey = { name: '', salesPointId: '', userId: '' };
    this.createDialog = true;
  }

  createApiKey(): void {
    if (!this.newKey.name || !this.newKey.salesPointId || !this.newKey.userId) return;
    this.creating = true;

    const salesPointId = this.newKey.salesPointId;
    const accountId = this.selectedAccountId!;

    this.apiKeyService.create({
      name: this.newKey.name,
      accountId,
      salesPointId,
      userId: this.newKey.userId,
    }).pipe(
      switchMap((res) => {
        this.createdPlainKey = res.plainKey;
        this.createdSalesPointId = salesPointId;
        return this.apiKeyService.createActivationKey(res.id, { accountId, salesPointId });
      }),
    ).subscribe({
      next: (activationRes) => {
        this.creating = false;
        this.createDialog = false;
        this.createdActivationKey = activationRes.key;
        this.showKeyDialog = true;
        this.loadApiKeys();
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'API Key y clave de activación creadas.' });
      },
      error: (err) => {
        this.creating = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear la API Key.' });
      },
    });
  }

  // --- Toggle active ---
  toggleActive(key: IntegrationApiKey): void {
    const newState = !key.isActive;
    this.apiKeyService.update(key.id, { isActive: newState }).subscribe({
      next: () => {
        key.isActive = newState;
        this.messageService.add({
          severity: 'info',
          summary: newState ? 'Activada' : 'Desactivada',
          detail: `API Key "${key.name}" ${newState ? 'activada' : 'desactivada'}.`,
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' });
      },
    });
  }

  // --- Delete ---
  confirmDelete(key: IntegrationApiKey): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la API Key "${key.name}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.apiKeyService.remove(key.id).subscribe({
          next: () => {
            this.apiKeys = this.apiKeys.filter(k => k.id !== key.id);
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: `API Key "${key.name}" eliminada.` });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' });
          },
        });
      },
    });
  }

  // --- Copy to clipboard ---
  copyToClipboard(): void {
    navigator.clipboard.writeText(this.createdPlainKey).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiada', detail: 'API Key copiada al portapapeles.' });
    });
  }

  copyValue(value: string | null): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Valor copiado al portapapeles.' });
    });
  }

  // --- Activation Keys ---
  openActivationKeysDialog(key: IntegrationApiKey): void {
    this.selectedApiKeyForActivation = key;
    this.activationKeysDialog = true;
    this.loadActivationKeys(key.id);
  }

  loadActivationKeys(apiKeyId: string): void {
    this.loadingActivationKeys = true;
    this.apiKeyService.getActivationKeys(apiKeyId).subscribe({
      next: (keys) => {
        this.activationKeys = keys;
        this.loadingActivationKeys = false;
      },
      error: () => {
        this.activationKeys = [];
        this.loadingActivationKeys = false;
      },
    });
  }

  generateActivationKey(): void {
    if (!this.selectedApiKeyForActivation) return;
    this.creatingActivation = true;

    this.apiKeyService.createActivationKey(this.selectedApiKeyForActivation.id, {
      accountId: this.selectedAccountId!,
      salesPointId: this.selectedApiKeyForActivation.salesPoint.id,
    }).subscribe({
      next: (res) => {
        this.creatingActivation = false;
        this.createdActivationKey = res.key;
        this.showActivationKeyDialog = true;
        this.loadActivationKeys(this.selectedApiKeyForActivation!.id);
        this.messageService.add({ severity: 'success', summary: 'Generada', detail: 'Clave de activación creada.' });
      },
      error: (err) => {
        this.creatingActivation = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al generar clave.' });
      },
    });
  }

  revokeActivationKey(ak: ActivationKey): void {
    this.confirmationService.confirm({
      message: `¿Revocar la clave "${ak.key}"? El POS asociado dejará de funcionar.`,
      header: 'Confirmar revocación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Revocar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.apiKeyService.revokeActivationKey(ak.id).subscribe({
          next: () => {
            ak.isActive = false;
            this.messageService.add({ severity: 'info', summary: 'Revocada', detail: 'Clave de activación revocada.' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo revocar.' });
          },
        });
      },
    });
  }

  copyActivationKey(): void {
    navigator.clipboard.writeText(this.createdActivationKey).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiada', detail: 'Clave de activación copiada.' });
    });
  }

  getActivationStatusSeverity(ak: ActivationKey): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    if (!ak.isActive) return 'danger';
    if (ak.activatedAt) return 'success';
    return 'warning';
  }

  getActivationStatusLabel(ak: ActivationKey): string {
    if (!ak.isActive) return 'Revocada';
    if (ak.activatedAt) return 'Activada';
    return 'Pendiente';
  }

  // --- Helpers ---
  getSalesPointName(key: IntegrationApiKey): string {
    return key.salesPoint?.name || '-';
  }

  getStatusSeverity(isActive: boolean): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    return isActive ? 'success' : 'danger';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activa' : 'Inactiva';
  }
}
