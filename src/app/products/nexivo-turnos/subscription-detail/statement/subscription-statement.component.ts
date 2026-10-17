import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  AdminCharge, AdminStatement, ChargePaymentMethod, NexivoTurnosAdminService,
} from '../../services/nexivo-turnos-admin.service';

type ReasonAction = 'void' | 'revert' | 'reject';

/**
 * Estado de cuenta de una suscripción de Turnos (pestaña del detalle):
 * resumen de deuda y cargos (devengamientos) con las operaciones de cobranza
 * — acreditar, anular, restaurar, revertir, rechazar transferencia, editar y
 * crear cargos manuales. Modelo de management-app `admin-account-billing`.
 */
@Component({
  selector: 'app-subscription-statement',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule, DialogModule,
    InputTextModule, InputTextareaModule, InputNumberModule, DropdownModule, CheckboxModule, TooltipModule,
  ],
  templateUrl: './subscription-statement.component.html',
})
export class SubscriptionStatementComponent implements OnChanges {
  @Input({ required: true }) subscriptionId!: string;
  /** Algo cambió el estado de la suscripción (ej. acreditar un período): el detalle recarga. */
  @Output() changed = new EventEmitter<void>();

  statement: AdminStatement | null = null;
  loading = false;
  saving = false;
  showVoided = false;

  // Acreditar
  markPaidDialog = false;
  markPaidCharge: AdminCharge | null = null;
  markPaidMethod: ChargePaymentMethod = 'bank_transfer';
  markPaidNotes = '';
  methodOptions = [
    { label: 'Transferencia', value: 'bank_transfer' },
    { label: 'Mercado Pago (cobrado por fuera)', value: 'mercado_pago' },
    { label: 'Otro / efectivo', value: 'manual' },
  ];

  // Motivo (anular / revertir / rechazar transferencia)
  reasonDialog = false;
  reasonAction: ReasonAction = 'void';
  reasonCharge: AdminCharge | null = null;
  reasonText = '';

  // Cargo manual (alta / edición)
  chargeDialog = false;
  editingCharge: AdminCharge | null = null;
  chargeConcept = '';
  chargeAmount: number | null = null;
  chargeDueDate = '';
  chargeNotes = '';

  constructor(
    private svc: NexivoTurnosAdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnChanges(): void {
    if (this.subscriptionId) this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getStatement(this.subscriptionId).subscribe({
      next: (st) => { this.statement = st; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.toastError(err, 'No se pudo cargar el estado de cuenta');
      },
    });
  }

  get visibleCharges(): AdminCharge[] {
    const charges = this.statement?.charges ?? [];
    return this.showVoided ? charges : charges.filter((c) => c.status !== 'voided');
  }

  isOpen(c: AdminCharge): boolean {
    return c.status === 'pending' || c.status === 'overdue';
  }

  formatCurrency(v: number | null | undefined): string {
    return `$${Number(v ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
  }

  statusLabel(c: AdminCharge): string {
    if (this.isOpen(c) && c.transferReportedAt) return 'Transferencia informada';
    return { pending: 'Por vencer', overdue: 'Vencido', paid: 'Pagado', voided: 'Anulado' }[c.status] ?? c.status;
  }

  statusSeverity(c: AdminCharge): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (this.isOpen(c) && c.transferReportedAt) return 'info';
    return ({ pending: 'warning', overdue: 'danger', paid: 'success', voided: 'secondary' } as const)[c.status] ?? 'secondary';
  }

  kindLabel(c: AdminCharge): string {
    if (c.kind === 'activation') return 'Alta / cambio de plan';
    if (c.kind === 'manual') return 'Cargo manual';
    return c.isCurrentPeriod ? 'Período (vigente)' : 'Período';
  }

  methodLabel(m: string | null): string {
    return ({ mercado_pago: 'Mercado Pago', bank_transfer: 'Transferencia', manual: 'Manual' } as Record<string, string>)[m ?? ''] ?? '—';
  }

  // ── Acreditar ─────────────────────────────────────────────────────────────

  openMarkPaid(c: AdminCharge): void {
    this.markPaidCharge = c;
    this.markPaidMethod = c.transferReportedAt ? 'bank_transfer' : 'manual';
    this.markPaidNotes = '';
    this.markPaidDialog = true;
  }

  confirmMarkPaid(): void {
    if (!this.markPaidCharge) return;
    this.saving = true;
    this.svc.markChargePaid(this.markPaidCharge.id, {
      method: this.markPaidMethod,
      notes: this.markPaidNotes.trim() || undefined,
    }).subscribe({
      next: (st) => {
        this.statement = st;
        this.saving = false;
        this.markPaidDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Acreditado', detail: 'Se registró el pago y se avisó al negocio por email.' });
        this.changed.emit();
      },
      error: (err) => { this.saving = false; this.toastError(err, 'No se pudo acreditar'); },
    });
  }

  // ── Anular / revertir / rechazar ──────────────────────────────────────────

  openReason(c: AdminCharge, action: ReasonAction): void {
    this.reasonCharge = c;
    this.reasonAction = action;
    this.reasonText = '';
    this.reasonDialog = true;
  }

  get reasonTitle(): string {
    return { void: 'Anular cargo', revert: 'Revertir pago', reject: 'Rechazar transferencia' }[this.reasonAction];
  }

  get reasonHint(): string {
    switch (this.reasonAction) {
      case 'void': return 'El cargo deja de ser deuda pero queda en el historial. Se puede restaurar.';
      case 'revert': return 'El cargo vuelve a pendiente/vencido. No mueve el período de la suscripción hacia atrás.';
      case 'reject': return 'Se borra el aviso de transferencia y se le envía al negocio un email con el motivo.';
    }
  }

  confirmReason(): void {
    const c = this.reasonCharge;
    const reason = this.reasonText.trim();
    if (!c || !reason) return;
    this.saving = true;
    const req = this.reasonAction === 'void'
      ? this.svc.voidCharge(c.id, reason)
      : this.reasonAction === 'revert'
        ? this.svc.revertCharge(c.id, reason)
        : this.svc.rejectTransfer(c.id, reason);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.reasonDialog = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: this.reasonTitle + ': listo' });
        this.load();
        this.changed.emit();
      },
      error: (err) => { this.saving = false; this.toastError(err, 'No se pudo completar la acción'); },
    });
  }

  restore(c: AdminCharge): void {
    this.confirmationService.confirm({
      header: 'Restaurar cargo',
      message: `"${c.concept}" vuelve a ser deuda del negocio. ¿Continuar?`,
      icon: 'pi pi-replay',
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.svc.restoreCharge(c.id).subscribe({
          next: () => { this.load(); this.changed.emit(); },
          error: (err) => this.toastError(err, 'No se pudo restaurar'),
        });
      },
    });
  }

  // ── Cargo manual / edición ────────────────────────────────────────────────

  openNewCharge(): void {
    this.editingCharge = null;
    this.chargeConcept = '';
    this.chargeAmount = null;
    this.chargeDueDate = new Date().toISOString().slice(0, 10);
    this.chargeNotes = '';
    this.chargeDialog = true;
  }

  openEditCharge(c: AdminCharge): void {
    this.editingCharge = c;
    this.chargeConcept = c.concept;
    this.chargeAmount = c.amount;
    this.chargeDueDate = c.dueDate.slice(0, 10);
    this.chargeNotes = c.adminNotes ?? '';
    this.chargeDialog = true;
  }

  get chargeFormValid(): boolean {
    if (this.chargeAmount === null || this.chargeAmount < 0) return false;
    if (!this.editingCharge) return !!this.chargeConcept.trim() && this.chargeAmount > 0 && !!this.chargeDueDate;
    return true;
  }

  saveCharge(): void {
    if (!this.chargeFormValid) return;
    this.saving = true;
    const c = this.editingCharge;
    const req = c
      ? this.svc.updateCharge(c.id, {
        amount: this.chargeAmount!,
        adminNotes: this.chargeNotes,
        // Concepto y vencimiento sólo son editables en cargos manuales / altas.
        ...(c.kind === 'manual' ? { concept: this.chargeConcept.trim() } : {}),
        ...(c.kind !== 'period' ? { dueDate: this.chargeDueDate } : {}),
      })
      : this.svc.createCharge(this.subscriptionId, {
        concept: this.chargeConcept.trim(),
        amount: this.chargeAmount!,
        dueDate: this.chargeDueDate,
        adminNotes: this.chargeNotes.trim() || undefined,
      });
    req.subscribe({
      next: () => {
        this.saving = false;
        this.chargeDialog = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: c ? 'Cargo actualizado' : 'Cargo creado' });
        this.load();
      },
      error: (err) => { this.saving = false; this.toastError(err, 'No se pudo guardar el cargo'); },
    });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportCsv(): void {
    if (!this.statement) return;
    const d = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '');
    const n = (v: number) => Number(v || 0).toFixed(2).replace('.', ',');
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Tipo', 'Concepto', 'Vencimiento', 'Lista', 'Descuento', 'Importe', 'Estado', 'Pagado', 'Medio', 'Anulado por']];
    for (const c of this.statement.charges) {
      rows.push([
        this.kindLabel(c), c.concept, d(c.dueDate), n(c.grossAmount), n(c.discountAmount), n(c.amount),
        this.statusLabel(c), d(c.paidAt), c.paymentMethod ? this.methodLabel(c.paymentMethod) : '', c.voidReason ?? '',
      ]);
    }
    const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `estado-cuenta-${this.statement.business?.slug ?? this.subscriptionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private toastError(err: any, fallback: string): void {
    const msg = err?.error?.message;
    this.messageService.add({ severity: 'error', summary: 'Error', detail: Array.isArray(msg) ? msg.join(' ') : msg || fallback });
  }
}
