const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ark_token');
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name?: string; org_name?: string }) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; org_id: string } }>(
      '/api/auth/register',
      data
    ),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; org_id: string } }>(
      '/api/auth/login',
      data
    ),
  me: () => api.get<{ id: string; email: string; name: string; org_id: string; org: { name: string } }>('/api/auth/me'),
};

// Invoices
export const invoicesApi = {
  upload: (data: { file_data: string; file_name?: string; media_type?: string }) =>
    api.post('/api/invoices/upload', data),
  list: (params?: { status?: string; page?: number; limit?: number; vendor_id?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.vendor_id) qs.set('vendor_id', params.vendor_id);
    return api.get(`/api/invoices${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  get: (id: string) => api.get(`/api/invoices/${id}`),
  confirm: (id: string, data: unknown) => api.patch(`/api/invoices/${id}/confirm`, data),
  setStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/api/invoices/${id}/status`, { status, reason }),
  audit: (id: string) => api.get(`/api/invoices/${id}/audit`),
};

// Dashboard
export const dashboardApi = {
  summary: () => api.get('/api/dashboard/summary'),
  aging: () => api.get('/api/dashboard/aging'),
  activity: () => api.get('/api/dashboard/activity'),
};

// Reconcile
export const reconcileApi = {
  manual: (data: unknown) => api.post('/api/reconcile/manual', data),
  unmatched: () => api.get('/api/reconcile/unmatched'),
  match: (data: { bank_transaction_id: string; invoice_id: string }) =>
    api.post('/api/reconcile/match', data),
};

// Chase
export const chaseApi = {
  draft: (invoice_id: string, tone?: string) =>
    api.post('/api/chase/draft', { invoice_id, tone }),
  send: (data: unknown) => api.post('/api/chase/send', data),
  list: () => api.get('/api/chase'),
};

// Vendors
export const vendorsApi = {
  list: () => api.get('/api/vendors'),
  create: (data: unknown) => api.post('/api/vendors', data),
  get: (id: string) => api.get(`/api/vendors/${id}`),
  update: (id: string, data: unknown) => api.patch(`/api/vendors/${id}`, data),
  invoices: (id: string) => api.get(`/api/vendors/${id}/invoices`),
};
