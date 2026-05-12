# Editor de planes Turnos → `maxReminders`

## Rule

El campo `Max. recordatorios por turno` (1 a 3, default 1) define
cuántos slots de recordatorio puede configurar el negocio en
Ajustes → Notificaciones.

## Where this lives

- Form: `src/app/products/nexivo-turnos/plans/turnos-plans.component.html`
  bajo el bloque "Limites de recursos".
- Default del nuevo plan:
  `src/app/products/nexivo-turnos/plans/turnos-plans.component.ts`
  → `DEFAULT_PLAN()`.
- Resumen autogenerado (`generateFeatures`): si `maxReminders > 1`
  agrega una línea `"N recordatorios por turno"`.

## Backend

El cambio se persiste en `plans.max_reminders` (turnos-api). Ver
[turnos-api/documentation/multi-reminders.md](../../turnos-api/documentation/multi-reminders.md)
para la lógica completa (cron, UNIQUE INDEX, truncación en el save
del negocio).
