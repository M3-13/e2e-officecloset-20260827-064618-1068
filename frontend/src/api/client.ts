const TOKEN_KEY = 'auth_token';

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
}

export interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = options.token !== undefined ? options.token : getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let code = 'error';
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as Partial<{ error: ApiErrorBody }>;
      if (data.error) {
        code = data.error.code ?? code;
        message = data.error.message ?? message;
      }
    } catch {
      // Non-JSON error body: fall back to the status-based message.
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
