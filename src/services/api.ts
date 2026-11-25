let memoryToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  memoryToken = token;
}

export function getAuthToken(): string | null {
  return memoryToken;
}

export function setUnauthorizedHandler(cb: () => void): void {
  onUnauthorizedCallback = cb;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (memoryToken) {
    headers.set('Authorization', `Bearer ${memoryToken}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (response.status === 401 && onUnauthorizedCallback && !path.startsWith('/api/auth/login')) {
    onUnauthorizedCallback();
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
    }
    return data as T;
  }

  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status);
  }
  return (await response.text()) as unknown as T;
}

export async function downloadReportFile(reportId: string, format: 'txt' | 'json'): Promise<void> {
  const headers = new Headers();
  if (memoryToken) {
    headers.set('Authorization', `Bearer ${memoryToken}`);
  }
  const resp = await fetch(`/api/reports/${encodeURIComponent(reportId)}/download?format=${format}`, {
    headers,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Download failed.' }));
    throw new ApiError(err.error || 'Download failed.', resp.status);
  }
  const blob = await resp.blob();
  const disposition = resp.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : `JOBSHIELD_Report_${reportId}.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
