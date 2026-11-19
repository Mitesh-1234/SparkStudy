const configuredOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const apiOrigin = import.meta.env.DEV ? configuredOrigin : '';

export async function api(url, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(apiOrigin + '/api' + url, {
    method,
    credentials: 'include',
    cache: method === 'GET' ? 'no-store' : 'default',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      if (response.status === 429) throw Error('Too many requests. Please wait and try again.');
      throw Error(response.ok ? 'Invalid server response' : `Server error (${response.status})`);
    }
  }
  if (!response.ok) throw Error(payload.error || `Request failed (${response.status})`);
  return payload;
}
