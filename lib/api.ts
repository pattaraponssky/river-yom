// lib/api.ts - สร้างใหม่
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH']
    .includes((options.method ?? 'GET').toUpperCase());

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // เพิ่ม CSRF เฉพาะ write operations
  if (isWrite) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('X-CSRF-TOKEN', csrf);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Token หมดอายุ → redirect login
  if (res.status === 401) {
    window.location.href = '/dashboard';
    throw new Error('Session หมดอายุ');
  }

  return res;
}

// ใช้แทน fetch ทั่วไป
// เดิม: fetch(`${API_URL}/api/rain_info`, { method: 'DELETE' })
// ใหม่: apiRequest(`${API_URL}/api/rain_info/${id}`, { method: 'DELETE' })