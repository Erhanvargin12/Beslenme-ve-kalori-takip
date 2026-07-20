/**
 * Fetch Response gövdesini yalnızca bir kez okur (stream tekrar kullanılamaz).
 */
export async function parseFetchJson<T = Record<string, unknown>>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    if (!response.ok) {
      throw new Error(`Sunucu hatası (HTTP ${response.status})`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (!response.ok) {
      throw new Error(text.slice(0, 400) || `Sunucu hatası (HTTP ${response.status})`);
    }
    throw new Error('Sunucu yanıtı geçerli JSON değil.');
  }
}

export function getErrorMessageFromBody(
  body: unknown,
  fallback: string
): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const msg = (body as { error?: unknown }).error;
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
  }
  return fallback;
}
