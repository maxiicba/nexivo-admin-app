# Cobranzas de Nexivo Turnos — flujo de admin

En Turnos, cada período de una suscripción paga es un **cargo con vencimiento** que se
genera por adelantado. Desde acá se ve quién debe, se acreditan las transferencias y se
corrigen los cargos a mano. El backend es turnos-api (`documentation/subscription-charges.md`).

## Menú Nexivo Turnos → Cobranzas (`/products/nexivo-turnos/collections`)

Arriba hay cuatro indicadores: vencido, lo que vence en 7 días, transferencias por
verificar y lo cobrado en el mes. Debajo, tres pestañas:

- **Deudores**
  - Negocios con saldo, ordenados por el vencido más viejo. Por defecto solo muestra los
    que tienen algo vencido.
  - Elegí varios y tocá **Enviar aviso** para mandarles un email: *Recordatorio de saldo*
    (importe y vencimiento de cada uno) o *Mensaje libre*.
  - La flecha abre el estado de cuenta del negocio.
- **Transferencias**
  - Las transferencias que informaron los negocios.
  - **Acreditar** registra el pago y, si era el período o un alta de plan, renueva o
    activa la suscripción. Se le avisa al negocio por email.
  - **Rechazar** pide un motivo y le manda un email al negocio con ese motivo.
- **Datos bancarios**
  - Alias, CBU, titular, CUIT, banco e instrucciones que ven los negocios.
  - El switch habilita o deshabilita el pago por transferencia.

Para recibir un email cada vez que un negocio informa una transferencia, configurá
`BILLING_ALERT_EMAIL` en turnos-api.

## Suscripción → pestaña Estado de cuenta

Muestra el resumen (saldo, vencido, próximo vencimiento, cobrado) y todos los cargos.
Con **Ver anulados** también aparecen los anulados.

| Acción | Cuándo usarla |
|---|---|
| **Nuevo cargo** | Cobro suelto (ej. configuración inicial). No renueva el plan. |
| **Acreditar** (✓) | Llegó el pago por fuera de Mercado Pago. Si es el período vigente, renueva la suscripción. |
| **Editar** (✎) | Bajar el importe (queda como descuento). En cargos sueltos también cambia concepto y vencimiento. |
| **Anular** (⊘) | Perdonar un cargo. El período vigente **no** se anula: usá *Regalar tiempo* o cambiá el plan. |
| **Revertir** (↶) | Se acreditó por error. Vuelve a deuda, pero **no** retrocede el período. |
| **Restaurar** (⟲) | Deshace una anulación. |

Todo queda en la pestaña **Auditoría**, con los eventos `Cargo …` y `Transferencia …`.

Los **créditos** (*Aplicar crédito*) se descuentan en el momento del cargo del período
vigente o, si no hay ninguno abierto, del próximo que se genere.

## Aviso masivo desde Suscripciones

El botón **Notificar** de la lista de suscripciones ahora envía de verdad, solo por email,
con las mismas dos plantillas: recordatorio de saldo o mensaje libre.
