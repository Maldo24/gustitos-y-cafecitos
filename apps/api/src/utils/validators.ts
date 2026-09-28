/**
 * Validadores de entrada compartidos.
 * Se aplican SIEMPRE en el servidor: el frontend puede evitar errores, pero
 * la única frontera confiable es la API.
 */

// Caracteres que sirven para inyectar etiquetas HTML/script en texto
const MARKDUP_CHARS = /[<>{}\\]/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

const MAPS_ALLOWED_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'maps.google.com']);

/** Rechaza <script>, llaves y caracteres de control en cualquier texto libre. */
export function assertSafeText(value: string, field: string): string {
  const clean = value.trim();

  if (MARKDUP_CHARS.test(clean)) {
    throw new Error(`El campo "${field}" no puede contener los caracteres <, >, { } ni \\`);
  }

  if (CONTROL_CHARS.test(clean)) {
    throw new Error(`El campo "${field}" no puede contener caracteres de control`);
  }

  return clean;
}

/** Texto libre seguro: sin markup, con largo acotado. */
export function validatePlainText(
  value: unknown,
  field: string,
  { min = 1, max = 120 }: { min?: number; max?: number } = {}
): string {
  if (typeof value !== 'string') {
    throw new Error(`El campo "${field}" es requerido`);
  }

  const clean = assertSafeText(value, field);

  if (clean.length < min) {
    throw new Error(`El campo "${field}" debe tener al menos ${min} caracteres`);
  }

  if (clean.length > max) {
    throw new Error(`El campo "${field}" no puede superar los ${max} caracteres`);
  }

  return clean;
}

/** Nombres de persona: letras (con acentos), espacios, apóstrofos y guiones. Nada más. */
export function validatePersonName(value: unknown, field: string): string {
  const clean = validatePlainText(value, field, { min: 2, max: 50 });

  if (!/^[a-zA-ZñÑáéíóúüÁÉÍÓÚÜ' -]+$/.test(clean)) {
    throw new Error(`El campo "${field}" solo puede contener letras, espacios, apóstrofos o guiones`);
  }

  return clean;
}

/** Username: solo letras y números, 3 a 20. Sin espacios ni símbolos. */
export function validateUsername(value: unknown): string {
  const clean = validatePlainText(value, 'nombre de usuario', { min: 3, max: 20 });

  if (!/^[a-zA-Z0-9]+$/.test(clean)) {
    throw new Error('El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras y numeros');
  }

  return clean;
}

export function validateEmail(value: unknown): string {
  const clean = validatePlainText(value, 'correo', { max: 120 }).toLowerCase();

  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) {
    throw new Error('El correo electronico no tiene un formato valido');
  }

  return clean;
}

/**
 * Solo se aceptan links reales de Google Maps.
 * Además cierra el vector de XSS por href (javascript:, data:, vbscript:).
 */
export function isGoogleMapsLink(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');

  if (MAPS_ALLOWED_HOSTS.has(host)) return true;

  // Sitios de Google por país: google.cl, google.es, google.com.mx, etc.
  const isGoogleDomain = host === 'google.com' || /^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host);
  if (isGoogleDomain) {
    return url.pathname === '/maps' || url.pathname.startsWith('/maps/');
  }

  return false;
}

export function validateGoogleMapsLink(value: unknown): string {
  const clean = validatePlainText(value, 'link de Google Maps', { max: 500 });

  if (!isGoogleMapsLink(clean)) {
    throw new Error('El link debe ser de Google Maps (ej: https://maps.app.goo.gl/... o https://www.google.com/maps/...)');
  }

  return clean;
}
