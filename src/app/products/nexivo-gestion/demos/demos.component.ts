import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DemosService } from '../services/demos.service';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Component({
  selector: 'app-demos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    TabViewModule,
    TagModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    CalendarModule,
    ToastModule,
    ConfirmDialogModule,
    InputSwitchModule,
    TooltipModule,
    MultiSelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './demos.component.html',
})
export class DemosComponent implements OnInit {

  private destroyRef = inject(DestroyRef);

  // ── Stats ────────────────────────────────────────────────────────────────
  stats: any = { total: 0, pending: 0, completed: 0, conversionRate: 0 };

  // ── Requests ─────────────────────────────────────────────────────────────
  requests: any[] = [];
  loadingRequests = false;
  statusFilter: string | null = null;

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Contactado', value: 'contacted' },
    { label: 'Completada', value: 'completed' },
    { label: 'Cancelada', value: 'cancelled' },
    { label: 'Reprogramada', value: 'rescheduled' },
  ];

  editableStatusOptions = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Contactado', value: 'contacted' },
    { label: 'Completada', value: 'completed' },
    { label: 'Cancelada', value: 'cancelled' },
    { label: 'Reprogramada', value: 'rescheduled' },
  ];

  // ── Detail dialog ─────────────────────────────────────────────────────────
  showDetailDialog = false;
  selectedRequest: any = null;
  editStatus = '';
  editAssignedTo = '';
  editAdminNotes = '';
  savingRequest = false;

  // ── Availability ──────────────────────────────────────────────────────────
  availability: any[] = [];
  loadingAvailability = false;
  showAvailabilityDialog = false;
  editingAvailability: any = null;
  savingAvailability = false;

  availabilityForm: any = {
    days_of_week: [],
    start_time: '',
    end_time: '',
    slot_duration: 30,
    is_active: true,
  };

  dayOptions = DAY_NAMES.map((name, i) => ({ label: name, value: i }));

  slotDurationOptions = [
    { label: '15 minutos', value: 15 },
    { label: '30 minutos', value: 30 },
    { label: '45 minutos', value: 45 },
    { label: '60 minutos', value: 60 },
  ];

  // ── Blocked slots ─────────────────────────────────────────────────────────
  blockedSlots: any[] = [];
  loadingBlocked = false;
  showBlockedDialog = false;
  savingBlocked = false;

  blockedForm: any = {
    date: null,
    start_time: '',
    end_time: '',
    reason: '',
  };

  constructor(
    private demosService: DemosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRequests();
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  loadStats(): void {
    this.demosService.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.stats = data; },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las estadísticas' });
        },
      });
  }

  // ── Requests ─────────────────────────────────────────────────────────────

  loadRequests(): void {
    this.loadingRequests = true;
    const params: any = {};
    if (this.statusFilter) params.status = this.statusFilter;
    this.demosService.getRequests(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.requests = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
          this.loadingRequests = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las solicitudes' });
          this.loadingRequests = false;
        },
      });
  }

  filterRequests(): void {
    this.loadRequests();
  }

  openDetail(req: any): void {
    this.selectedRequest = req;
    this.editStatus = req.status;
    this.editAssignedTo = req.assigned_to ?? '';
    this.editAdminNotes = req.admin_notes ?? '';
    this.showDetailDialog = true;
  }

  saveRequest(): void {
    if (!this.selectedRequest) return;
    this.savingRequest = true;
    const payload: any = {
      status: this.editStatus,
      assigned_to: this.editAssignedTo || null,
      admin_notes: this.editAdminNotes || null,
    };
    this.demosService.updateRequest(this.selectedRequest.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Solicitud actualizada correctamente' });
          this.showDetailDialog = false;
          this.savingRequest = false;
          this.loadRequests();
          this.loadStats();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la solicitud' });
          this.savingRequest = false;
        },
      });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      completed: 'Completada',
      cancelled: 'Cancelada',
      rescheduled: 'Reprogramada',
    };
    return map[status] ?? status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      pending: 'warning',
      contacted: 'info',
      completed: 'success',
      cancelled: 'danger',
      rescheduled: 'secondary',
    };
    return map[status] ?? 'info';
  }

  // ── Tab change: lazy load config data ────────────────────────────────────

  onTabChange(event: any): void {
    if (event.index === 1) {
      this.loadAvailability();
      this.loadBlockedSlots();
    }
  }

  // ── Availability ──────────────────────────────────────────────────────────

  loadAvailability(): void {
    this.loadingAvailability = true;
    this.demosService.getAvailability()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.availability = data;
          this.loadingAvailability = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la disponibilidad' });
          this.loadingAvailability = false;
        },
      });
  }

  openNewAvailability(): void {
    this.editingAvailability = null;
    this.availabilityForm = { days_of_week: [], start_time: '', end_time: '', slot_duration: 30, is_active: true };
    this.showAvailabilityDialog = true;
  }

  openEditAvailability(row: any): void {
    this.editingAvailability = row;
    this.availabilityForm = {
      days_of_week: [row.day_of_week],
      start_time: row.start_time,
      end_time: row.end_time,
      slot_duration: row.slot_duration,
      is_active: row.is_active,
    };
    this.showAvailabilityDialog = true;
  }

  saveAvailability(): void {
    this.savingAvailability = true;

    if (this.editingAvailability) {
      // Editing: update single block
      const payload = {
        day_of_week: this.availabilityForm.days_of_week[0],
        start_time: this.availabilityForm.start_time,
        end_time: this.availabilityForm.end_time,
        slot_duration: this.availabilityForm.slot_duration,
        is_active: this.availabilityForm.is_active,
      };
      this.demosService.updateAvailability(this.editingAvailability.id, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Disponibilidad actualizada' });
            this.showAvailabilityDialog = false;
            this.savingAvailability = false;
            this.loadAvailability();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la disponibilidad' });
            this.savingAvailability = false;
          },
        });
    } else {
      // Creating: one block per selected day
      const days: number[] = this.availabilityForm.days_of_week || [];
      if (days.length === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccioná al menos un día' });
        this.savingAvailability = false;
        return;
      }
      let completed = 0;
      let hasError = false;
      for (const day of days) {
        const payload = {
          day_of_week: day,
          start_time: this.availabilityForm.start_time,
          end_time: this.availabilityForm.end_time,
          slot_duration: this.availabilityForm.slot_duration,
          is_active: this.availabilityForm.is_active,
        };
        this.demosService.createAvailability(payload)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              completed++;
              if (completed === days.length) {
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: `${days.length} bloque(s) de disponibilidad creado(s)` });
                this.showAvailabilityDialog = false;
                this.savingAvailability = false;
                this.loadAvailability();
              }
            },
            error: () => {
              if (!hasError) {
                hasError = true;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron crear algunos bloques' });
                this.savingAvailability = false;
              }
            },
          });
      }
    }
  }

  toggleAvailabilityActive(row: any): void {
    this.demosService.updateAvailability(row.id, { is_active: row.is_active })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Estado actualizado' });
        },
        error: () => {
          row.is_active = !row.is_active;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
        },
      });
  }

  confirmDeleteAvailability(row: any): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este bloque de disponibilidad?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAvailability(row.id),
    });
  }

  private deleteAvailability(id: string): void {
    this.demosService.deleteAvailability(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Bloque eliminado' });
          this.loadAvailability();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el bloque' });
        },
      });
  }

  getDayName(dayIndex: number): string {
    return DAY_NAMES[dayIndex] ?? '-';
  }

  // ── Blocked Slots ─────────────────────────────────────────────────────────

  loadBlockedSlots(): void {
    this.loadingBlocked = true;
    this.demosService.getBlockedSlots()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.blockedSlots = data;
          this.loadingBlocked = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los bloqueos' });
          this.loadingBlocked = false;
        },
      });
  }

  openNewBlockedSlot(): void {
    this.blockedForm = { date: null, start_time: '', end_time: '', reason: '' };
    this.showBlockedDialog = true;
  }

  saveBlockedSlot(): void {
    if (!this.blockedForm.date) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La fecha es obligatoria' });
      return;
    }
    this.savingBlocked = true;

    const dateValue = this.blockedForm.date instanceof Date
      ? this.blockedForm.date.toISOString().split('T')[0]
      : this.blockedForm.date;

    const payload = { ...this.blockedForm, date: dateValue };

    this.demosService.createBlockedSlot(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Bloqueo creado correctamente' });
          this.showBlockedDialog = false;
          this.savingBlocked = false;
          this.loadBlockedSlots();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el bloqueo' });
          this.savingBlocked = false;
        },
      });
  }

  confirmDeleteBlockedSlot(row: any): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este bloqueo de horario?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteBlockedSlot(row.id),
    });
  }

  private deleteBlockedSlot(id: string): void {
    this.demosService.deleteBlockedSlot(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Bloqueo eliminado' });
          this.loadBlockedSlots();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el bloqueo' });
        },
      });
  }
}
