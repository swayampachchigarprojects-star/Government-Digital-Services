import { config } from '../config';

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ApiClientOptions = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

let options: ApiClientOptions = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export function configureApiClient(nextOptions: ApiClientOptions): void {
  options = nextOptions;
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

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  const token = options.getToken();
  if (token && !path.startsWith('/auth/')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Unable to connect to the server. Please try again.');
  }

  const bodyText = await response.text();
  let body: unknown;
  try {
    body = bodyText ? JSON.parse(bodyText) : undefined;
  } catch {
    body = undefined;
  }

  if (response.status === 401 && !path.startsWith('/auth/')) {
    options.onUnauthorized();
  }

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response.status), body);
  }

  if (!bodyText) return undefined as T;
  return body as T;
}
