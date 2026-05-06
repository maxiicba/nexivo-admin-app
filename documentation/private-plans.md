# Planes privados — flujo de admin

Permite ofrecer planes a una empresa específica, sin exponerlos en el catálogo público.

## Crear un plan privado

1. Ir a Nexivo Turnos → Planes → **+ Nuevo Plan** (o editar uno existente).
2. Configurar campos normales (nombre, precios, límites, features).
3. En la sección **Visibilidad**:
   - Elegir **Privada** o **Restringida** (`Pública` es el default).
   - Toggle **El negocio puede elegirlo desde su panel** (`assignableBySelf`):
     - **Encendido**: el negocio whitelisteado verá este plan en su pantalla de planes y podrá suscribirse solo.
     - **Apagado**: el plan no aparece en la pantalla del cliente. Solo el superadmin puede asignarlo desde admin.
4. Guardar el plan. **Antes de guardar, la lista de negocios autorizados no puede gestionarse** (necesita el `id` del plan).
5. Reabrir el plan. En la sub-sección **Negocios autorizados**, buscar negocios por nombre o slug y agregarlos.

## Asignar un plan privado a un negocio existente

Desde la suscripción del negocio (admin de subs), elegir el plan privado en el selector. Si el negocio no estaba en la whitelist, se **auto-agrega**. No hace falta editarla manualmente.

## Quitar a un negocio de la whitelist

Editar el plan → sub-sección "Negocios autorizados" → botón ✕. La suscripción activa del negocio **no se cancela**. Pero al intentar cambiar de plan, ya no podrá volver al privado.

## Casos de uso

- **Plan a medida**: empresa negocia un precio o límites custom; queda exclusivo para ella.
- **Plan partner**: clientes referidos por un partner reciben acceso a un plan especial.
- **Beta cerrada**: probar un plan nuevo con un puñado de negocios antes de hacerlo público.

## Diferencia visual

- **Privado**: badge naranja "Privado" (con icono candado) en la card del plan.
- **Restringido**: badge rojo "Restringido" (con icono escudo).

Ambos son funcionalmente idénticos hoy. La diferencia es semántica para distinguir niveles de exclusividad.

## Endpoints consumidos

El componente del editor consume:

- `GET /subscriptions/plans/admin` — lista todos los planes.
- `GET /subscriptions/plans/:id/whitelist` — lista negocios autorizados.
- `POST /subscriptions/plans/:id/whitelist` — agrega negocio.
- `DELETE /subscriptions/plans/:id/whitelist/:businessId` — quita negocio.
- `GET /businesses/admin/search?q=<term>` — typeahead de negocios.

Detalles backend en [`turnos-api/documentation/private-plans.md`](../../turnos-api/documentation/private-plans.md).
