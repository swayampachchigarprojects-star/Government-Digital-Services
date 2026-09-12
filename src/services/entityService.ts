import { apiRequest, ApiError } from './apiClient';
import { getStoredEntityId, getStoredUser, storeEntityId } from './tokenStorage';

export interface PaymentTypeEntry {
  id: string;
  name: string;
  openingBalance: string;
}

export interface CreateEntityPaymentType {
  paymentType: string;
  balance: number;
}

export interface CreateEntityPayload {
  accountingEntityName: string;
  accountingEntityType: string;
  district: string;
  taluka: string;
  village: string;
  paymentTypes: CreateEntityPaymentType[];
}

export interface AccountingEntityCheckResult {
  exists: boolean;
  data?: unknown;
  accountEntityId?: string | null;
}

let cachedEntityId: string | null = null;
let cachedEntityData: Record<string, unknown> | null = null;

export function setCachedEntityId(id: string | null): void {
  cachedEntityId = id;
}

export function getCachedEntityData(): Record<string, unknown> | null {
  return cachedEntityData;
}

export function setCachedEntityData(data: Record<string, unknown> | null): void {
  cachedEntityData = data;
}

/**
 * Extracts accountEntityId from any supported response structure:
 * - { accountEntityId: "..." }
 * - { accountingEntityId: "..." }
 * - { id: "..." }
 */
export function extractEntityId(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  if (typeof record.accountEntityId === 'string' && record.accountEntityId.trim()) {
    return record.accountEntityId.trim();
  }
  if (typeof record.accountingEntityId === 'string' && record.accountingEntityId.trim()) {
    return record.accountingEntityId.trim();
  }
  if (typeof record.id === 'string' && record.id.trim()) {
    return record.id.trim();
  }
  return null;
}

/**
 * Dynamically resolves the accounting entity ID:
 * 1. Explicit ID passed to function
 * 2. In-memory cached entity ID
 * 3. Stored entity ID from secure storage / local storage
 * 4. Stored user object entity ID
 */
export async function resolveEntityId(explicitId?: string | null): Promise<string | null> {
  if (explicitId && typeof explicitId === 'string' && explicitId.trim()) {
    return explicitId.trim();
  }
  if (cachedEntityId) {
    return cachedEntityId;
  }
  const storedId = await getStoredEntityId();
  if (storedId && storedId.trim()) {
    cachedEntityId = storedId.trim();
    return cachedEntityId;
  }
  const storedUser = await getStoredUser();
  const userEntityId =
    storedUser?.accountingEntityId ||
    (storedUser as Record<string, unknown> | null)?.accountEntityId;
  if (typeof userEntityId === 'string' && userEntityId.trim()) {
    cachedEntityId = userEntityId.trim();
    return cachedEntityId;
  }
  return null;
}

/**
 * Checks if the authenticated user has an existing accounting entity.
 * Calls GET http://192.168.0.248:8080/accounting-entity
 * - 200 OK: returns { exists: true, data, accountEntityId }
 * - 404 Not Found: returns { exists: false }
 * - Other errors: rethrown to be handled by caller
 */
export async function getAccountingEntity(): Promise<AccountingEntityCheckResult> {
  try {
    const data = await apiRequest<unknown>('/accounting-entity', {
      method: 'GET',
      authenticated: true,
    });
    if (typeof data === 'object' && data !== null) {
      cachedEntityData = data as Record<string, unknown>;
    }
    const entityId = extractEntityId(data);
    if (entityId) {
      cachedEntityId = entityId;
      await storeEntityId(entityId);
    }
    return { exists: true, data, accountEntityId: entityId };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { exists: false };
    }
    throw error;
  }
}

/**
 * Calls GET http://192.168.0.248:8080/account-entity
 * Fetches current account entity details for the Profile screen.
 */
export async function getAccountEntity(): Promise<Record<string, unknown> | null> {
  try {
    const data = await apiRequest<unknown>('/accounting-entity', {
      method: 'GET',
      authenticated: true,
    });
    if (typeof data === 'object' && data !== null) {
      const record = data as Record<string, unknown>;
      cachedEntityData = record;
      const entityId = extractEntityId(record);
      if (entityId) {
        cachedEntityId = entityId;
        await storeEntityId(entityId);
      }
      return record;
    }
    return cachedEntityData;
  } catch (error) {
    if (__DEV__) {
      console.warn('[entityService] Failed to fetch /account-entity:', error);
    }
    return cachedEntityData;
  }
}

/**
 * Returns already-fetched accounting entity data from cache if present to avoid
 * redundant API calls. If not present, calls getAccountingEntity().
 */
export async function getOrFetchAccountingEntity(forceRefresh = false): Promise<Record<string, unknown> | null> {
  if (cachedEntityData && !forceRefresh) {
    return cachedEntityData;
  }
  const result = await getAccountingEntity();
  if (result.exists && typeof result.data === 'object' && result.data !== null) {
    cachedEntityData = result.data as Record<string, unknown>;
    return cachedEntityData;
  }
  return cachedEntityData;
}

/**
 * Creates a new accounting entity.
 * Calls POST http://192.168.0.248:8080/accounting-entity
 */
export async function createAccountingEntity(payload: CreateEntityPayload): Promise<unknown> {
  if (__DEV__) {
    console.log('[entityService] Creating accounting entity with payload:', JSON.stringify(payload, null, 2));
  }

  const response = await apiRequest<unknown>('/accounting-entity', {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify(payload),
  });

  if (typeof response === 'object' && response !== null) {
    cachedEntityData = response as Record<string, unknown>;
  }

  const entityId = extractEntityId(response);
  if (entityId) {
    cachedEntityId = entityId;
    await storeEntityId(entityId);
  }

  return response;
}
