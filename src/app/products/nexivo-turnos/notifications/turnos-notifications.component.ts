import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, of, switchMap } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';
import {
  AdminBroadcast, BroadcastAudience, BroadcastPreview, BroadcastTarget, TurnosNotificationsService,
} from './turnos-notifications.service';

interface BusinessOption { id: string; name: string; slug: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Nexivo Turnos → Notificaciones: mandar un mensaje a los negocios (campana del
 * panel y/o push del navegador). En Turnos cada usuario tiene un solo negocio,
 * así que "cuenta", "negocio" y "dueño" son el mismo destinatario.
 */
@Component({
  selector: 'app-turnos-notifications',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    AutoCompleteModule, ButtonModule, CheckboxModule, ConfirmDialogModule, InputTextModule,
    InputTextareaModule, MultiSelectModule, SelectButtonModule, TableModule, TagModule, ToastModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './turnos-notifications.component.html',
  styleUrls: ['./turnos-notifications.component.scss'],
})
export class TurnosNotificationsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly targets: { label: string; value: BroadcastTarget; icon: string }[] = [
    { label: 'Todos los negocios', value: 'all', icon: 'pi pi-globe' },
    { label: 'Por suscripción', value: 'status', icon: 'pi pi-filter' },
    { label: 'Negocios elegidos', value: 'businesses', icon: 'pi pi-building' },
    { label: 'Usuarios por email', value: 'emails', icon: 'pi pi-at' },
  ];

  readonly statusOptions = [
    { label: 'Activa', value: 'active' },
    { label: 'En prueba', value: 'trialing' },
    { label: 'Pago vencido', value: 'past_due' },
    { label: 'Suspendida', value: 'suspended' },
    { label: 'Cancelada', value: 'cancelled' },
  ];

  // Destinatarios
  target: BroadcastTarget = 'all';
  statuses: string[] = ['active', 'trialing'];
  selectedBusinesses: BusinessOption[] = [];
  businessSuggestions: BusinessOption[] = [];
  emailsText = '';

  // Mensaje
  title = '';
  body = '';
  link = '';
  viaInbox = true;
  viaPush = true;

  // Estado
  preview: BroadcastPreview | null = null;
  previewLoading = false;
  sending = false;

  // Historial
  history: AdminBroadcast[] = [];
  historyTotal = 0;
  historyPageSize = 20;
  historyLoading = false;

  private audienceChanged$ = new Subject<void>();

  constructor(
    private svc: TurnosNotificationsService,
    private turnosAdmin: NexivoTurnosAdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.audienceChanged$.pipe(
      debounceTime(400),
      switchMap(() => {
        const audience = this.audience;
        if (!audience) { this.preview = null; this.previewLoading = false; return of(null); }
        this.previewLoading = true;
        return this.svc.preview(audience);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (p) => { if (p) this.preview = p; this.previewLoading = false; },
      error: () => { this.preview = null; this.previewLoading = false; },
    });
    this.onAudienceChange();
  }

  /** `null` mientras el destino está incompleto. */
  get audience(): BroadcastAudience | null {
    switch (this.target) {
      case 'all': return { target: 'all' };
      case 'status': return this.statuses.length ? { target: 'status', statuses: this.statuses } : null;
      case 'businesses':
        return this.selectedBusinesses.length
          ? { target: 'businesses', businessIds: this.selectedBusinesses.map(b => b.id) }
          : null;
      case 'emails': {
        const { valid, invalid } = this.parsedEmails;
        return valid.length && !invalid.length ? { target: 'emails', emails: valid } : null;
      }
    }
  }

  get parsedEmails(): { valid: string[]; invalid: string[] } {
    const items = [...new Set(this.emailsText.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean))];
    return { valid: items.filter(e => EMAIL_RE.test(e)), invalid: items.filter(e => !EMAIL_RE.test(e)) };
  }

  get linkInvalid(): boolean {
    return !!this.link.trim() && !/^\/\S*$/.test(this.link.trim());
  }

  get canSend(): boolean {
    return !!this.audience && !!this.title.trim() && (this.viaInbox || this.viaPush)
      && !this.linkInvalid && !this.sending && (this.preview?.businesses ?? 0) > 0;
  }

  onAudienceChange(): void {
    this.previewLoading = true;
    this.audienceChanged$.next();
  }

  searchBusinesses(event: { query: string }): void {
    this.turnosAdmin.searchBusinesses(event.query).subscribe({
      next: (list) => {
        const chosen = new Set(this.selectedBusinesses.map(b => b.id));
        this.businessSuggestions = list.filter(b => !chosen.has(b.id));
      },
      error: () => { this.businessSuggestions = []; },
    });
  }

  confirmSend(): void {
    if (!this.canSend) return;
    const n = this.preview?.businesses ?? 0;
    const channels = [this.viaInbox && 'la campana', this.viaPush && 'push'].filter(Boolean).join(' y ');
    this.confirmationService.confirm({
      header: 'Enviar notificación',
      message: `Vas a enviar "${this.title.trim()}" a ${n} negocio${n === 1 ? '' : 's'} por ${channels}. No se puede deshacer.`,
      icon: 'pi pi-send',
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      accept: () => this.send(),
    });
  }

  private send(): void {
    const audience = this.audience;
    if (!audience) return;
    this.sending = true;
    this.svc.send({
      ...audience,
      title: this.title.trim(),
      body: this.body.trim() || undefined,
      link: this.link.trim() || undefined,
      inbox: this.viaInbox,
      push: this.viaPush,
    }).subscribe({
      next: (res) => {
        const push = res.viaPush ? ` · push: ${res.pushSent} entregados${res.pushFailed ? `, ${res.pushFailed} fallidos` : ''}` : '';
        this.messageService.add({
          severity: 'success',
          summary: 'Notificación enviada',
          detail: `${res.businessCount} negocio${res.businessCount === 1 ? '' : 's'}${push}`,
          life: 6000,
        });
        this.title = '';
        this.body = '';
        this.link = '';
        this.sending = false;
        this.loadHistory(1);
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo enviar',
          detail: Array.isArray(msg) ? msg.join(' · ') : msg || 'Error inesperado',
        });
        this.sending = false;
      },
    });
  }

  onHistoryPage(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    this.loadHistory(Math.floor(first / this.historyPageSize) + 1);
  }

  private loadHistory(page: number): void {
    this.historyLoading = true;
    this.svc.history(page).subscribe({
      next: (res) => {
        this.history = res.items;
        this.historyTotal = res.total;
        this.historyPageSize = res.pageSize;
        this.historyLoading = false;
      },
      error: () => { this.historyLoading = false; },
    });
  }

  audienceLabel(a: BroadcastAudience): string {
    switch (a.target) {
      case 'all': return 'Todos los negocios';
      case 'status':
        return 'Suscripción: ' + (a.statuses ?? [])
          .map(s => this.statusOptions.find(o => o.value === s)?.label ?? s).join(', ');
      case 'businesses': return `${a.businessIds?.length ?? 0} negocio(s) elegido(s)`;
      case 'emails': return (a.emails ?? []).join(', ');
    }
  }
}
