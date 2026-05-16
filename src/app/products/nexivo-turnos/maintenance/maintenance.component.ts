import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MaintenanceService, MaintenanceConfig } from './maintenance.service';

@Component({
  selector: 'app-turnos-maintenance',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputSwitchModule, InputTextareaModule,
    ToastModule, ConfirmDialogModule, TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
})
export class MaintenanceComponent implements OnInit {
  loading = false;
  saving = false;
  config: MaintenanceConfig | null = null;
  isEnabled = false;
  message = '';

  constructor(
    private svc: MaintenanceService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getConfig().subscribe({
      next: (c) => {
        this.applyConfig(c);
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message || 'No se pudo cargar la configuración',
        });
        this.loading = false;
      },
    });
  }

  private applyConfig(c: MaintenanceConfig): void {
    this.config = c;
    this.isEnabled = c.isEnabled;
    this.message = c.message ?? '';
  }

  onSwitchChange(event: { checked: boolean }): void {
    if (event.checked) {
      this.doEnable();
    } else {
      // Revert visual until confirm
      this.isEnabled = true;
      this.confirmationService.confirm({
        message: '¿Desactivar el modo mantenimiento? Los usuarios podrán volver a acceder.',
        header: 'Confirmar',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.doDisable(),
      });
    }
  }

  private doEnable(): void {
    this.saving = true;
    this.svc.enable().subscribe({
      next: (c) => {
        this.applyConfig(c);
        this.saving = false;
        this.messageService.add({
          severity: 'success', summary: 'Activado',
          detail: 'Modo mantenimiento activado',
        });
      },
      error: (err) => {
        this.saving = false;
        this.isEnabled = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message || 'No se pudo activar',
        });
      },
    });
  }

  private doDisable(): void {
    this.saving = true;
    this.svc.disable().subscribe({
      next: (c) => {
        this.applyConfig(c);
        this.saving = false;
        this.messageService.add({
          severity: 'success', summary: 'Desactivado',
          detail: 'Modo mantenimiento desactivado',
        });
      },
      error: (err) => {
        this.saving = false;
        this.isEnabled = true;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message || 'No se pudo desactivar',
        });
      },
    });
  }

  regenerateCode(): void {
    this.confirmationService.confirm({
      message: '¿Regenerar el código de bypass? El código actual dejará de funcionar.',
      header: 'Confirmar',
      icon: 'pi pi-refresh',
      accept: () => {
        this.saving = true;
        this.svc.regenerateCode().subscribe({
          next: (c) => {
            this.applyConfig(c);
            this.saving = false;
            this.messageService.add({
              severity: 'success', summary: 'Código regenerado',
              detail: 'Nuevo código de bypass generado',
            });
          },
          error: (err) => {
            this.saving = false;
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: err?.error?.message || 'No se pudo regenerar',
            });
          },
        });
      },
    });
  }

  saveMessage(): void {
    this.saving = true;
    this.svc.updateMessage(this.message).subscribe({
      next: (c) => {
        this.applyConfig(c);
        this.saving = false;
        this.messageService.add({
          severity: 'success', summary: 'Guardado',
          detail: 'Mensaje actualizado',
        });
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message || 'No se pudo guardar el mensaje',
        });
      },
    });
  }

  copyCode(): void {
    if (!this.config?.bypassCode) return;
    navigator.clipboard.writeText(this.config.bypassCode).then(
      () => this.messageService.add({
        severity: 'success', summary: 'Copiado',
        detail: 'Código copiado al portapapeles',
      }),
      () => this.messageService.add({
        severity: 'error', summary: 'Error',
        detail: 'No se pudo copiar',
      }),
    );
  }
}
