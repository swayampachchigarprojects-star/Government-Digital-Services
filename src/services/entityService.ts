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
  if (Array.isArray(data)) {
    cachedEntityData = (data[0] as Record<string, unknown>) || null;
  } else {
    cachedEntityData = data;
  }
}

export function clearEntityCache(): void {
  cachedEntityId = null;
  cachedEntityData = null;
  resolvingEntityPromise = null;
}

/**
 * Extracts accountEntityId from any supported response structure:
 * - string ID
 * - array of entities
 * - { accountEntityId: "..." }
 * - { accountingEntityId: "..." }
 * - { entityId: "..." }
 * - { id: "..." }
 * - nested objects: { data: { ... } }, { entity: { ... } }, etc.
 */
export function extractEntityId(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }
  if (Array.isArray(data) && data.length > 0) {
    for (const item of data) {
      const extracted = extractEntityId(item);
      if (extracted) return extracted;
    }
    return null;
  }
  if (typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  const directKeys = [
    'accountEntityId',
    'accountingEntityId',
    'entityId',
    'id',
  ];
  for (const key of directKeys) {
    const val = record[key];
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }

  const nestedKeys = ['data', 'entity', 'accountingEntity', 'accountEntity'];
  for (const key of nestedKeys) {
    const nested = record[key];
    if (nested && typeof nested === 'object') {
      const extracted = extractEntityId(nested);
      if (extracted) return extracted;
    }
  }

  return null;
}

let resolvingEntityPromise: Promise<string | null> | null = null;

/**
 * Dynamically resolves the accounting entity ID:
 * 1. Explicit ID passed to function
 * 2. In-memory cached entity ID
 * 3. Stored entity ID from secure storage / local storage
 * 4. Stored user object entity ID
 * 5. Cached entity data extraction
 * 6. Fallback fetch via getAccountingEntity()
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
  if (cachedEntityData) {
    const fromCachedData = extractEntityId(cachedEntityData);
    if (fromCachedData) {
      cachedEntityId = fromCachedData;
      await storeEntityId(fromCachedData);
      return cachedEntityId;
    }
  }

  // Deduplicate concurrent in-flight entity resolution requests
  if (resolvingEntityPromise) {
    return resolvingEntityPromise;
  }

  resolvingEntityPromise = (async () => {
    try {
      const checkResult = await getAccountingEntity();
      if (checkResult.exists && checkResult.accountEntityId) {
        return checkResult.accountEntityId;
      }
    } catch {
      // Non-blocking fallback
    } finally {
      resolvingEntityPromise = null;
    }
    return null;
  })();

  return resolvingEntityPromise;
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
      cachedEntityData = Array.isArray(data)
        ? (data[0] as Record<string, unknown>) || null
        : (data as Record<string, unknown>);
    }
    console.log("Data is: " + data);
    let entityId = extractEntityId(data);
    if (!entityId) {
      const storedId = await getStoredEntityId();
      if (storedId && storedId.trim()) {
        entityId = storedId.trim();
      } else {
        const storedUser = await getStoredUser();
        const userEntityId =
          storedUser?.accountingEntityId ||
          (storedUser as Record<string, unknown> | null)?.accountEntityId;
        if (typeof userEntityId === 'string' && userEntityId.trim()) {
          entityId = userEntityId.trim();
        }
      }
    }
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
      const record = Array.isArray(data)
        ? (data[0] as Record<string, unknown>) || null
        : (data as Record<string, unknown>);
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
