import { apiRequest } from './apiClient';

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleSignupRequest extends GoogleLoginRequest {
  accountingEntityId: string;
}

export interface AuthenticationResponse {
  accessToken: string;
}

function isAuthenticationResponse(value: unknown): value is AuthenticationResponse {
  return typeof value === 'object' && value !== null &&
    typeof (value as { accessToken?: unknown }).accessToken === 'string' &&
    (value as { accessToken: string }).accessToken.length > 0;
}

async function exchange(path: string, payload: GoogleLoginRequest | GoogleSignupRequest): Promise<string> {
  const response = await apiRequest<unknown>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!isAuthenticationResponse(response)) {
    throw new Error('The authentication response was invalid.');
  }
  return response.accessToken;
}

export const authService = {
  loginWithGoogle(idToken: string): Promise<string> {
    return exchange('/auth/login/google', { idToken });
  },
  signupWithGoogle(idToken: string, accountingEntityId: string): Promise<string> {
    return exchange('/auth/signup/google', { idToken, accountingEntityId });
  },
  async logout(): Promise<void> {
    await apiRequest('/auth/logout', {
      method: 'POST',
      authenticated: true,
    });
  },
};
