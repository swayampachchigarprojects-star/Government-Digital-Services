import { apiRequest } from './apiClient';

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleSignupRequest extends GoogleLoginRequest {
  accountingEntityId: string;
}

export interface AuthenticationResponse {
  accessToken: string;
  tokenType: string | null;
  expiresInSeconds: number | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  language: string | null;
  accountingEntityId: string | null;
  accountingEntityName: string | null;
  accountingEntityCode: string | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  roles: string[] | null;
}

export type AuthenticatedUser = Omit<AuthenticationResponse, 'accessToken' | 'tokenType' | 'expiresInSeconds'>;

function parseAuthenticationResponse(value: unknown): AuthenticationResponse | null {
  if (typeof value !== 'object' || value === null) return null;
  const response = value as Record<string, unknown>;
  if (typeof response.accessToken !== 'string' || response.accessToken.length === 0) return null;
  return {
    accessToken: response.accessToken,
    tokenType: typeof response.tokenType === 'string' ? response.tokenType : null,
    expiresInSeconds: typeof response.expiresInSeconds === 'number' ? response.expiresInSeconds : null,
    userId: typeof response.userId === 'string' ? response.userId : null,
    email: typeof response.email === 'string' ? response.email : null,
    name: typeof response.name === 'string' ? response.name : null,
    language: typeof response.language === 'string' ? response.language : null,
    accountingEntityId: typeof response.accountingEntityId === 'string' ? response.accountingEntityId : null,
    accountingEntityName: typeof response.accountingEntityName === 'string' ? response.accountingEntityName : null,
    accountingEntityCode: typeof response.accountingEntityCode === 'string' ? response.accountingEntityCode : null,
    district: typeof response.district === 'string' ? response.district : null,
    taluka: typeof response.taluka === 'string' ? response.taluka : null,
    village: typeof response.village === 'string' ? response.village : null,
    roles: Array.isArray(response.roles)
      ? response.roles.filter((role): role is string => typeof role === 'string')
      : null,
  };
}

async function exchange(path: string, payload: GoogleLoginRequest | GoogleSignupRequest): Promise<AuthenticationResponse> {
  const response = await apiRequest<unknown>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const authenticationResponse = parseAuthenticationResponse(response);
  if (!authenticationResponse) {
    throw new Error('The authentication response was invalid.');
  }
  return authenticationResponse;
}

export const authService = {
  loginWithGoogle(idToken: string): Promise<AuthenticationResponse> {
    return exchange('/auth/login/google', { idToken });
  },
  signupWithGoogle(idToken: string, accountingEntityId: string): Promise<AuthenticationResponse> {
    return exchange('/auth/signup/google', { idToken, accountingEntityId });
  },
  async logout(): Promise<void> {
    await apiRequest('/auth/logout', {
      method: 'POST',
      authenticated: true,
    });
  },
};
