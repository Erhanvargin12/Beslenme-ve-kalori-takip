/**
 * Geliştirmede Vite proxy (/api → backend) kullanılır; böylece HTTPS panel
 * HTTP API'ye doğrudan istek atmaz (tarayıcı mixed-content engeli olmaz).
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return '/api';
  }

  if (typeof window !== 'undefined') {
    const port = import.meta.env.VITE_BACKEND_PORT || '3000';
    return `http://${window.location.hostname}:${port}`;
  }

  return 'http://localhost:3000';
}
