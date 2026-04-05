import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusLabel',
  standalone: true,
})
export class StatusLabelPipe implements PipeTransform {
  transform(status: string): string {
    if (!status) {
      return '';
    }
    switch (status.toLowerCase()) {
      case 'active':
        return 'ACTIVO';
      case 'inactive':
        return 'INACTIVO';
      case 'suspended':
        return 'SUSPENDIDO';
      case 'pending_deletion':
        return 'ELIMINACIÓN PENDIENTE';
      default:
        return status;
    }
  }
}
