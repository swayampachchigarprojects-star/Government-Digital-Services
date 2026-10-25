import { apiRequest } from './apiClient';
import { resolveEntityId } from './entityService';
import { fetchPaymentTypes } from './transactionService';

export interface BalanceItem {
  balType: string;
  balValue: number | string;
}

export interface BalanceResponse {
  balances: BalanceItem[];
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
}

function normalizeBalances(list: unknown[]): BalanceItem[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const rec = item as Record<string, unknown>;
      const balType =
        (typeof rec.balType === 'string' && rec.balType.trim()) ||
        (typeof rec.paymentType === 'string' && rec.paymentType.trim()) ||
        (typeof rec.paymentTypeName === 'string' && rec.paymentTypeName.trim()) ||
        (typeof rec.name === 'string' && rec.name.trim()) ||
        (typeof rec.type === 'string' && rec.type.trim()) ||
        '';
      const balValue =
        typeof rec.balValue === 'number' || typeof rec.balValue === 'string'
          ? rec.balValue
          : typeof rec.balance === 'number' || typeof rec.balance === 'string'
            ? rec.balance
            : typeof rec.amount === 'number' || typeof rec.amount === 'string'
              ? rec.amount
              : 0;
      if (!balType) return null;
      return { balType, balValue };
    })
    .filter((item): item is BalanceItem => item !== null);
}

export async function fetchBalances(entityId?: string): Promise<BalanceResponse> {
  const resolvedId = await resolveEntityId(entityId);
  if (!resolvedId) {
    return { balances: [] };
  }
  try {
    const data = await apiRequest<unknown>(`/balance/${encodeURIComponent(resolvedId)}`);
    if (isBalanceResponse(data)) {
      const normalized = normalizeBalances(data.balances);
      if (normalized.length > 0) return { balances: normalized };
    }
    if (Array.isArray(data)) {
      const normalized = normalizeBalances(data);
      if (normalized.length > 0) return { balances: normalized };
    }
    if (typeof data === 'object' && data !== null) {
      const rec = data as Record<string, unknown>;
      if (Array.isArray(rec.data)) {
        const normalized = normalizeBalances(rec.data);
        if (normalized.length > 0) return { balances: normalized };
      }
      if (Array.isArray(rec.balances)) {
        const normalized = normalizeBalances(rec.balances);
        if (normalized.length > 0) return { balances: normalized };
      }
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('[dashboardService] Error fetching /balance:', err);
    }
  }

  // Fallback: If balance endpoint returns empty or fails, derive balances from payment types
  try {
    const paymentTypes = await fetchPaymentTypes(resolvedId);
    if (paymentTypes && paymentTypes.length > 0) {
      const derived: BalanceItem[] = paymentTypes.map((pt) => ({
        balType: pt.paymentType || pt.name || 'Account',
        balValue: typeof pt.balance === 'number' ? pt.balance : '0.00',
      }));
      return { balances: derived };
    }
  } catch {
    // Non-blocking fallback
  }

  return { balances: [] };
}

function isBalanceResponse(value: unknown): value is BalanceResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { balances?: unknown }).balances)
  );
}

