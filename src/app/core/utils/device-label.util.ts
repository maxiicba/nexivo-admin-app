/**
 * Traduce un User-Agent a algo que una persona reconozca: "Chrome en Windows".
 *
 * Copia deliberada del util homónimo del management-app: son proyectos
 * separados y no comparten build. Si cambia uno, revisar el otro.
 *
 * El orden de los `if` importa: Edge se declara `Edg/` ADEMÁS de `Chrome`, y
 * casi todo navegador de iOS incluye `Safari` en su UA.
 */
export function deviceLabel(ua: string | null | undefined): string {
  if (!ua) return 'Dispositivo desconocido';
  const s = ua.toLowerCase();

  const os = s.includes('windows') ? 'Windows'
    : s.includes('android') ? 'Android'
    : (s.includes('iphone') || s.includes('ipad')) ? 'iOS'
    : (s.includes('mac os') || s.includes('macintosh')) ? 'macOS'
    : s.includes('linux') ? 'Linux' : 'Otro sistema';

  const browser = s.includes('edg/') ? 'Edge'
    : (s.includes('chrome') && !s.includes('edg/')) ? 'Chrome'
    : s.includes('firefox') ? 'Firefox'
    : (s.includes('safari') && !s.includes('chrome')) ? 'Safari' : 'Navegador';

  return browser + ' en ' + os;
}

/**
 * Tipo de dispositivo de una sesión, tal como lo clasifica la API
 * (`device-kind.util.ts` en management-api). El cupo es UNA sesión de
 * computadora y UNA de celular al mismo tiempo.
 */
export type DeviceKind = 'mobile' | 'desktop';

/**
 * Cómo nombrar ese tipo en el cartel del login. Con dos sesiones posibles el
 * aviso tiene que decir CUÁL se cierra; el fallback cubre una API sin el campo.
 */
export function deviceKindLabel(kind: DeviceKind | null | undefined): string {
  if (kind === 'mobile') return 'otro celular';
  if (kind === 'desktop') return 'otra computadora';
  return 'otro dispositivo';
}
