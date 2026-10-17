import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
  BillingOverview, ChargePaymentMethod, Debtor, NexivoTurnosAdminService, TransferSettings,
} from '../services/nexivo-turnos-admin.service';

/**
 * Mesa de cobranzas de Nexivo Turnos (modelo management-app `/admin/billing`
 * pestaña Cobranzas): KPIs, deudores ordenados por el vencido más viejo,
 * cola de transferencias informadas para acreditar o rechazar y los datos
 * bancarios que ven los negocios. Avisos sólo por email.
 */
@Component({
  selector: 'app-turnos-collections',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TabViewModule, ButtonModule, TableModule, TagModule, DialogModule,
    InputTextModule, InputTextareaModule, InputSwitchModule, DropdownModule, CheckboxModule, ToastModule, TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './turnos-collections.component.html',
})
export class TurnosCollectionsComponent implements OnInit {
  overview: BillingOverview | null = null;
  debtors: Debtor[] = [];
  transfers: any[] = [];
  settings: TransferSettings = { isEnabled: false };

  loadingDebtors = false;
  loadingTransfers = false;
  savingSettings = false;
  saving = false;

  onlyOverdue = true;
  search = '';
  selectedDebtors: Debtor[] = [];

  // Aviso masivo
  notifyDialog = false;
  notifyTemplate: 'payment_reminder' | 'custom' = 'payment_reminder';
  notifyMessage = '';
  templateOptions = [
    { label: 'Recordatorio de saldo (importe y vencimiento)', value: 'payment_reminder' },
    { label: 'Mensaje libre', value: 'custom' },
  ];

  // Acreditar / rechazar transferencia
  rejectDialog = false;
  rejectTarget: any = null;
  rejectReason = '';

  constructor(
    private svc: NexivoTurnosAdminService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadDebtors();
    this.loadTransfers();
    this.svc.getTransferSettings().subscribe({
      next: (s) => (this.settings = { ...s }),
      error: () => {},
    });
  }

  loadOverview(): void {
    this.svc.getBillingOverview().subscribe({
      next: (o) => (this.overview = o),
      error: (err) => this.toastError(err, 'No se pudo cargar el resumen'),
    });
  }

  loadDebtors(): void {
    this.loadingDebtors = true;
    this.svc.getDebtors({ onlyOverdue: this.onlyOverdue, search: this.search.trim() || undefined }).subscribe({
      next: (rows) => { this.debtors = rows; this.selectedDebtors = []; this.loadingDebtors = false; },
      error: (err) => { this.loadingDebtors = false; this.toastError(err, 'No se pudieron cargar los deudores'); },
    });
  }

  loadTransfers(): void {
    this.loadingTransfers = true;
    this.svc.getReportedTransfers().subscribe({
      next: (rows) => { this.transfers = rows; this.loadingTransfers = false; },
      error: (err) => { this.loadingTransfers = false; this.toastError(err, 'No se pudieron cargar las transferencias'); },
    });
  }

  refreshAll(): void {
    this.loadOverview();
    this.loadDebtors();
    this.loadTransfers();
  }

  openSubscription(subscriptionId: string): void {
    this.router.navigate(['/products/nexivo-turnos/subscriptions', subscriptionId]);
  }

  formatCurrency(v: number | null | undefined): string {
    return `$${Number(v ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
  }

  statusLabel(status: string): string {
    return ({ active: 'Activa', trialing: 'Prueba', past_due: 'Vencida', suspended: 'Suspendida', cancelled: 'Cancelada' } as Record<string, string>)[status] ?? status;
  }

  statusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    return ({ active: 'success', trialing: 'info', past_due: 'warning', suspended: 'danger', cancelled: 'secondary' } as const)[status as 'active'] ?? 'secondary';
  }

  // ── Transferencias ────────────────────────────────────────────────────────

  confirmTransfer(t: any): void {
    this.saving = true;
    this.svc.markChargePaid(t.id, { method: 'bank_transfer' as ChargePaymentMethod }).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Acreditada', detail: `${t.businessName}: pago registrado y avisado por email.` });
        this.refreshAll();
      },
      error: (err) => { this.saving = false; this.toastError(err, 'No se pudo acreditar'); },
    });
  }

  openReject(t: any): void {
    this.rejectTarget = t;
    this.rejectReason = '';
    this.rejectDialog = true;
  }

  confirmReject(): void {
    if (!this.rejectTarget || !this.rejectReason.trim()) return;
    this.saving = true;
    this.svc.rejectTransfer(this.rejectTarget.id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.saving = false;
        this.rejectDialog = false;
        this.messageService.add({ severity: 'info', summary: 'Rechazada', detail: 'Se le avisó al negocio por email.' });
        this.refreshAll();
      },
      error: (err) => { this.saving = false; this.toastError(err, 'No se pudo rechazar'); },
    });
  }

  // ── Aviso masivo (email) ──────────────────────────────────────────────────

  openNotify(): void {
    if (!this.selectedDebtors.length) return;
    this.notifyTemplate = 'payment_reminder';
    this.notifyMessage = '';
    this.notifyDialog = true;
  }

  confirmNotify(): void {
    const ids = this.selectedDebtors.map((d) => d.subscriptionId);
    if (!ids.length) return;
    if (this.notifyTemplate === 'custom' && !this.notifyMessage.trim()) return;
    this.saving = true;
    this.svc.bulkNotify(ids, 'email', this.notifyTemplate,
      this.notifyTemplate === 'custom' ? this.notifyMessage.trim() : undefined).subscribe({
      next: (res) => {
        this.saving = false;
        this.notifyDialog = false;
        const failed = res.failed.length;
        this.messageService.add({
          severity: failed ? 'warn' : 'success',
          summary: 'Avisos enviados',
          detail: `${res.success.length} enviados${failed ? `, ${failed} con error: ${res.failed.map((f) => f.error).join('; ')}` : ''}`,
          life: failed ? 10000 : 4000,
        });
        this.selectedDebtors = [];
      },
      error: (err) => { this.saving = false; this.toastError(err, 'No se pudieron enviar'); },
    });
  }

  // ── Datos bancarios ───────────────────────────────────────────────────────

  saveSettings(): void {
    this.savingSettings = true;
    this.svc.updateTransferSettings(this.settings).subscribe({
      next: (s) => {
        this.settings = { ...s };
        this.savingSettings = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Datos bancarios actualizados' });
      },
      error: (err) => { this.savingSettings = false; this.toastError(err, 'No se pudo guardar'); },
    });
  }

  private toastError(err: any, fallback: string): void {
    const msg = err?.error?.message;
    this.messageService.add({ severity: 'error', summary: 'Error', detail: Array.isArray(msg) ? msg.join(' ') : msg || fallback });
  }
}
