import { config } from '../config';

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;
  readonly endpoint?: string;
  readonly url?: string;

  constructor(status: number, message: string, details?: unknown, endpoint?: string, url?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.endpoint = endpoint;
    this.url = url;
  }
}

type ApiClientOptions = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

export type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
};

let options: ApiClientOptions = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export function configureApiClient(nextOptions: ApiClientOptions): void {
  options = nextOptions;
}

export function getAuthToken(): string | null {
  return options.getToken();
}

function getErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'The request could not be completed.';
    case 403: return 'You are not authorized to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'This request conflicts with existing data.';
    case 429: return 'Too many requests. Please try again later.';
    case 500: return 'The server could not complete the request.';
    default: return 'The request could not be completed.';
  }
}

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

export async function apiRequestWithResponse<T>(
  path: string,
  init: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { authenticated = false, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  headers.set('Accept', 'application/json');
  if (requestInit.body !== undefined) headers.set('Content-Type', 'application/json');

  const token = options.getToken();
  const isPublicAuthRequest = path === '/auth/login/google' || path === '/auth/signup/google';
  if (token && (authenticated || !path.startsWith('/auth/'))) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fullUrl = `${config.apiBaseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(fullUrl, { ...requestInit, headers });
  } catch (err: any) {
    throw new ApiError(
      0,
      `Unable to connect to the server: ${err?.message || String(err)}`,
      err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
      path,
      fullUrl,
    );
  }

  const bodyText = await response.text();
  let body: unknown;
  try {
    body = bodyText ? JSON.parse(bodyText) : undefined;
  } catch {
    body = undefined;
  }

  if (response.status === 401 && !isPublicAuthRequest && !path.endsWith('/logout')) {
    options.onUnauthorized();
  }

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response.status), body, path, fullUrl);
  }

  return {
    status: response.status,
    data: (!bodyText ? undefined : body) as T,
  };
}

export async function apiRequest<T>(
  path: string,
  init: ApiRequestOptions = {},
): Promise<T> {
  const res = await apiRequestWithResponse<T>(path, init);
  return res.data;
}

