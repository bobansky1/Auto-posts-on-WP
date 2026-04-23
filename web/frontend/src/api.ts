import { getToken, removeToken } from './auth';
import type {
  GenerateRequest,
  GenerateResponse,
  ErrorResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  PublicationRecord,
} from './types';

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new Error('Network error — please check your connection');
  }

  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}

export async function generate(req: GenerateRequest): Promise<GenerateResponse> {
  const response = await apiFetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json();
    throw new Error(err.error);
  }

  return response.json() as Promise<GenerateResponse>;
}

export async function login(req: LoginRequest): Promise<TokenResponse> {
  let response: Response;
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail ?? 'Login failed');
  }

  return response.json() as Promise<TokenResponse>;
}

export async function register(req: RegisterRequest): Promise<TokenResponse> {
  let response: Response;
  try {
    response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    throw new Error('Network error — please check your connection');
  }

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail ?? 'Registration failed');
  }

  return response.json() as Promise<TokenResponse>;
}

export async function fetchHistory(): Promise<PublicationRecord[]> {
  const response = await apiFetch('/api/history');

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail ?? 'Failed to fetch history');
  }

  return response.json() as Promise<PublicationRecord[]>;
}

export async function addHistoryEntry(entry: Omit<PublicationRecord, 'id' | 'created_at'>): Promise<PublicationRecord> {
  const response = await apiFetch('/api/history', {
    method: 'POST',
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail ?? 'Failed to save history entry');
  }

  return response.json() as Promise<PublicationRecord>;
}

export async function clearHistory(): Promise<void> {
  const response = await apiFetch('/api/history', { method: 'DELETE' });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail ?? 'Failed to clear history');
  }
}
