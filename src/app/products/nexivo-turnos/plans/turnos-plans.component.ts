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
import { DropdownModule } from 'primeng/dropdown';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin, Subscription } from 'rxjs';
import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';

const DEFAULT_PLAN = () => ({
  name: '', displayName: '', description: '',
  monthlyPrice: 0, annualPrice: 0, sortOrder: 0, isActive: true,
  maxProfessionals: 2, maxServices: 5, maxMonthlyAppointments: 100, maxClients: 50,
  maxReminders: 1,
  hasWhatsappBotSequential: false, hasWhatsappBotAI: false, hasOnlineBooking: true, hasPromotions: false,
  hasCoupons: false, hasAdvancedReports: false, hasFinance: false, hasCustomBranding: false,
  hasAudioTranscription: false,
  hasServiceInfoBot: false,
  hasLeaderboard: false,
  hasCashbox: false,
  maxWhatsappBotDailyMessagesPerNumber: 30,
  hasTrialPeriod: false, trialDays: 14,
  visibility: 'public',
  assignableBySelf: true,
  features: [] as string[],
});

@Component({
  selector: 'app-turnos-plans',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule,
    InputTextareaModule, InputNumberModule, InputSwitchModule, ToastModule,
    ConfirmDialogModule, CardModule, DividerModule, TagModule, DragDropModule, TooltipModule, DropdownModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './turnos-plans.component.html',
  styleUrls: ['./turnos-plans.component.scss'],
})
export class TurnosPlansComponent implements OnInit, OnDestroy {
  plans: any[] = [];
  loading = false;
  cycle: 'monthly' | 'annual' = 'monthly';

  // Feature list: cuántas features mostrar antes del "Ver más"
  featurePreviewCount = 3;
  private expanded = new Set<string>();

  isExpanded(planId: string): boolean { return this.expanded.has(planId); }
  toggleExpand(planId: string): void {
    if (this.expanded.has(planId)) this.expanded.delete(planId);
    else this.expanded.add(planId);
  }

  // The "featured" plan is the middle one (in price order) — used for the
  // RECOMENDADO ribbon. If only one plan exists, no ribbon shown.
  isFeatured(index: number, plan: any): boolean {
    if (!Array.isArray(this.plans) || this.plans.length < 2) return false;
    if (plan?.isFeatured === true || plan?.isPopular === true) return true;
    const visible = this.plans.filter(p => p.isActive);
    if (visible.length < 2) return false;
    const sorted = [...visible].sort((a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0));
    const mid = sorted[Math.floor(sorted.length / 2)];
    return mid && mid.id === plan?.id;
  }
  planDialog = false;
  isNewPlan = true;
  editingPlan: any = DEFAULT_PLAN();
  featureInput = '';
  saving = false;
  visibilityOptions = [
    { label: 'Pública', value: 'public' },
    { label: 'Privada', value: 'private' },
    { label: 'Restringida', value: 'restricted' },
  ];
  whitelist: { businessId: string; name: string; slug: string }[] = [];
  loadingWhitelist = false;
  businessSearchQuery = '';
  businessSearchResults: { id: string; name: string; slug: string }[] = [];
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
    this.editingPlan = {
      ...plan,
      features: [...(plan.features || [])],
      visibility: plan.visibility ?? 'public',
      assignableBySelf: plan.assignableBySelf ?? true,
    };
    this.featureInput = '';
    this.isNewPlan = false;
    this.planDialog = true;
    this.businessSearchQuery = '';
    this.businessSearchResults = [];
    this.whitelist = [];
    this.loadWhitelist();
  }

  loadWhitelist(): void {
    if (!this.editingPlan?.id || this.editingPlan.visibility === 'public') {
      this.whitelist = [];
      return;
    }
    this.loadingWhitelist = true;
    this.svc.listWhitelist(this.editingPlan.id).subscribe({
      next: (data) => { this.whitelist = data; this.loadingWhitelist = false; },
      error: () => { this.loadingWhitelist = false; },
    });
  }

  onVisibilityChange(): void {
    this.loadWhitelist();
  }

  searchBusinesses(): void {
    const q = this.businessSearchQuery?.trim() ?? '';
    if (q.length < 2) { this.businessSearchResults = []; return; }
    this.svc.searchBusinesses(q).subscribe({
      next: (results) => { this.businessSearchResults = results; },
    });
  }

  addBusinessToWhitelist(b: { id: string; name: string; slug: string }): void {
    if (!this.editingPlan?.id) return;
    this.svc.addToWhitelist(this.editingPlan.id, b.id).subscribe({
      next: () => {
        this.whitelist = [{ businessId: b.id, name: b.name, slug: b.slug }, ...this.whitelist];
        this.businessSearchQuery = '';
        this.businessSearchResults = [];
      },
      error: (err) => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.error?.message ?? 'No se pudo agregar el negocio',
      }),
    });
  }

  removeBusinessFromWhitelist(businessId: string): void {
    if (!this.editingPlan?.id) return;
    this.svc.removeFromWhitelist(this.editingPlan.id, businessId).subscribe({
      next: () => {
        this.whitelist = this.whitelist.filter((w) => w.businessId !== businessId);
      },
    });
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

  get featuresText(): string {
    return (this.editingPlan.features || []).join('\n');
  }

  set featuresText(val: string) {
    this.editingPlan.features = val.split('\n').filter((f: string) => f.trim());
  }

  generateFeatures(): void {
    const p = this.editingPlan;
    const lines: string[] = [];
    const fmt = (val: number) => !val || val >= 99999 ? 'Ilimitados' : `${val}`;

    lines.push(`${fmt(p.maxProfessionals)} profesionales`);
    lines.push(`${fmt(p.maxServices)} servicios`);
    lines.push(`${fmt(p.maxMonthlyAppointments)} turnos por mes`);
    lines.push(`${fmt(p.maxClients)} clientes`);
    if (p.maxReminders > 1) {
      lines.push(`${p.maxReminders} recordatorios por turno`);
    }

    if (p.hasOnlineBooking) lines.push('Reservas online');
    if (p.hasWhatsappBotSequential) lines.push('Bot WhatsApp');
    if (p.hasWhatsappBotAI) lines.push('Bot WhatsApp con IA');
    if (p.hasPromotions) lines.push('Promociones');
    if (p.hasCoupons) lines.push('Cupones');
    if (p.hasAdvancedReports) lines.push('Reportes avanzados');
    if (p.hasFinance) lines.push('Finanzas');
    if (p.hasCustomBranding) lines.push('Marca personalizada');
    if (p.hasAudioTranscription) lines.push('Transcripcion de audio');
    if (p.hasServiceInfoBot) lines.push('Bot responde sobre servicios');
    if (p.hasLeaderboard) lines.push('Top semanal en TV');
    if (p.hasCashbox) lines.push('Caja registradora');
    lines.push('Soporte por email');

    this.editingPlan.features = lines;
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
