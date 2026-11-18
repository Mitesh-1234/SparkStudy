const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function api(url, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(apiOrigin + '/api' + url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  if (!response.ok) throw Error(payload.error || 'Request failed');
  return payload;
}
