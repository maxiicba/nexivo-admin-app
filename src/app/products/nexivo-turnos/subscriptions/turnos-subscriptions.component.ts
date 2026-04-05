import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, Subscription } from 'rxjs';
import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';

@Component({
  selector: 'app-turnos-subscriptions',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, TagModule,
    DialogModule, InputTextModule, InputNumberModule, DropdownModule,
    ToastModule, ConfirmDialogModule, CardModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './turnos-subscriptions.component.html',
})
export class TurnosSubscriptionsComponent implements OnInit, OnDestroy {
  subscriptions: any[] = [];
  plans: any[] = [];
  stats: any = { total: 0, mrr: 0, byStatus: { active: 0, trialing: 0, past_due: 0, suspended: 0 } };
  loading = false;

  editDialog = false;
  editingSub: any = null;
  editData: any = { planId: '', billingCycle: 'monthly', currentPrice: 0 };

  cancelDialog = false;
  cancelSubId = '';
  cancelReason = '';

  billingCycleOptions = [
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'annual' },
  ];

  saving = false;
  private loadSub?: Subscription;

  constructor(
    private svc: NexivoTurnosAdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadSub?.unsubscribe();
    this.loading = true;
    this.loadSub = forkJoin({
      subs: this.svc.getAllSubscriptions(),
      stats: this.svc.getStats(),
      plans: this.svc.getAllPlans(),
    }).subscribe({
      next: ({ subs, stats, plans }) => {
        this.subscriptions = subs;
        this.stats = stats;
        this.plans = plans.map((pl: any) => ({ label: pl.displayName, value: pl.id }));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      active: 'success', trialing: 'info', past_due: 'warning', suspended: 'danger', cancelled: 'secondary'
    };
    return map[status];
  }

  openEdit(sub: any): void {
    this.editingSub = sub;
    this.editData = { planId: sub.planId || sub.plan?.id, billingCycle: sub.billingCycle, currentPrice: sub.currentPrice };
    this.editDialog = true;
  }

  saveEdit(): void {
    if (!this.editingSub) return;
    this.saving = true;
    this.svc.updateSubscription(this.editingSub.id, this.editData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Suscripción actualizada' });
        this.editDialog = false;
        this.saving = false;
        this.load();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
        this.saving = false;
      },
    });
  }

  openCancel(sub: any): void {
    this.cancelSubId = sub.id;
    this.cancelReason = '';
    this.cancelDialog = true;
  }

  confirmCancel(): void {
    this.saving = true;
    this.svc.cancelSubscription(this.cancelSubId, this.cancelReason).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Cancelado', detail: 'Suscripción cancelada' });
        this.cancelDialog = false;
        this.saving = false;
        this.load();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar' });
        this.saving = false;
      },
    });
  }

  formatCurrency(val: number): string {
    return `$${Number(val).toLocaleString('es-AR')}`;
  }
}
