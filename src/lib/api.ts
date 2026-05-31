const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    try {
      const stored = localStorage.getItem('citizen_portal_auth');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed.tokens?.accessToken || null;
    } catch {
      return null;
    }
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const stored = localStorage.getItem('citizen_portal_auth');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const refreshToken = parsed.tokens?.refreshToken;
      if (!refreshToken) return null;

      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem('citizen_portal_auth');
        window.location.href = '/login';
        return null;
      }

      const data = await res.json();
      const newAuth = { ...parsed, tokens: data.tokens };
      localStorage.setItem('citizen_portal_auth', JSON.stringify(newAuth));
      return data.tokens.accessToken;
    } catch {
      localStorage.removeItem('citizen_portal_auth');
      return null;
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getAccessToken();
    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (body && !(body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}/${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    const isAuthEndpoint = endpoint.startsWith('auth/login') || endpoint.startsWith('auth/register') || endpoint.startsWith('auth/google') || endpoint.startsWith('auth/change-password') || endpoint.startsWith('otp/');

    if (res.status === 401 && !isAuthEndpoint) {
      const newToken = await this.refreshToken();
      if (newToken) {
        requestHeaders['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${this.baseUrl}/${endpoint}`, {
          method,
          headers: requestHeaders,
          body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({ error: 'Request failed' }));
          throw new ApiError(retryRes.status, err.error || 'Request failed');
        }
        return retryRes.json();
      }
      throw new ApiError(401, 'Session expired. Please login again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(res.status, err.error || 'Request failed');
    }

    return res.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  upload<T>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: 'POST', body: formData });
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const api = new ApiClient(API_BASE);
