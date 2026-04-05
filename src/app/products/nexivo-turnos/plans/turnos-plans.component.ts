import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin, Subscription } from 'rxjs';
import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';

const DEFAULT_PLAN = () => ({
  name: '', displayName: '', description: '',
  monthlyPrice: 0, annualPrice: 0, sortOrder: 0, isActive: true,
  maxProfessionals: 2, maxServices: 5, maxMonthlyAppointments: 100, maxClients: 50,
  hasWhatsappBot: false, hasOnlineBooking: true, hasPromotions: false,
  hasCoupons: false, hasAdvancedReports: false, hasFinance: false, hasCustomBranding: false,
  hasTrialPeriod: false, trialDays: 14,
  features: [] as string[],
});

@Component({
  selector: 'app-turnos-plans',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule,
    InputTextareaModule, InputNumberModule, InputSwitchModule, ToastModule,
    ConfirmDialogModule, CardModule, DividerModule, TagModule, DragDropModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './turnos-plans.component.html',
})
export class TurnosPlansComponent implements OnInit, OnDestroy {
  plans: any[] = [];
  loading = false;
  planDialog = false;
  isNewPlan = true;
  editingPlan: any = DEFAULT_PLAN();
  featureInput = '';
  saving = false;
  private dragDropSub?: Subscription;

  constructor(
    private svc: NexivoTurnosAdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void { this.loadPlans(); }

  loadPlans(): void {
    this.loading = true;
    this.svc.getAllPlans().subscribe({
      next: (data) => { this.plans = [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openNew(): void {
    this.editingPlan = DEFAULT_PLAN();
    this.editingPlan.sortOrder = this.plans.length;
    this.featureInput = '';
    this.isNewPlan = true;
    this.planDialog = true;
  }

  openEdit(plan: any): void {
    this.editingPlan = { ...plan, features: [...(plan.features || [])] };
    this.featureInput = '';
    this.isNewPlan = false;
    this.planDialog = true;
  }

  addFeature(): void {
    const f = this.featureInput.trim();
    if (f && !this.editingPlan.features.includes(f)) {
      this.editingPlan.features = [...this.editingPlan.features, f];
    }
    this.featureInput = '';
  }

  removeFeature(f: string): void {
    this.editingPlan.features = this.editingPlan.features.filter((x: string) => x !== f);
  }

  savePlan(): void {
    this.saving = true;
    const op = this.isNewPlan
      ? this.svc.createPlan(this.editingPlan)
      : this.svc.updatePlan(this.editingPlan.id, this.editingPlan);

    op.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: `Plan ${this.isNewPlan ? 'creado' : 'actualizado'}` });
        this.planDialog = false;
        this.saving = false;
        this.loadPlans();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el plan' });
        this.saving = false;
      },
    });
  }

  confirmDelete(plan: any): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el plan "${plan.displayName}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.svc.deletePlan(plan.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Plan eliminado' });
            this.loadPlans();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' }),
        });
      },
    });
  }

  onDrop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.plans, event.previousIndex, event.currentIndex);
    const updates = this.plans
      .map((p, i) => ({ plan: p, newIndex: i }))
      .filter(({ plan, newIndex }) => plan.sortOrder !== newIndex)
      .map(({ plan, newIndex }) => {
        plan.sortOrder = newIndex;
        return this.svc.updatePlan(plan.id, { sortOrder: newIndex });
      });
    if (updates.length === 0) return;
    this.dragDropSub?.unsubscribe();
    this.dragDropSub = forkJoin(updates).subscribe({
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el orden' }),
    });
  }

  ngOnDestroy(): void {
    this.dragDropSub?.unsubscribe();
  }
}
