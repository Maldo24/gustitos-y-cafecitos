const MAPS_ALLOWED_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'maps.google.com']);

/**
 * Solo se aceptan links reales de Google Maps (https).
 * Evita que alguien "sugiera" un link a cualquier otra web.
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

  const isGoogleDomain =
    host === 'google.com' || /^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host);
  if (isGoogleDomain) {
    return url.pathname === '/maps' || url.pathname.startsWith('/maps/');
  }

  return false;
}
