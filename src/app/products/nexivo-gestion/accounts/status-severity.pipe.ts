import { Pipe, PipeTransform } from '@angular/core';

type BadgeSeverity = 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | 'help' | 'primary';

@Pipe({
  name: 'statusSeverity',
  standalone: true,
})
export class StatusSeverityPipe implements PipeTransform {
  transform(status: string): BadgeSeverity {
    if (!status) {
      return 'info';
    }
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'danger';
      case 'pending_deletion':
        return 'danger';
      default:
        return 'info';
    }
  }
}
