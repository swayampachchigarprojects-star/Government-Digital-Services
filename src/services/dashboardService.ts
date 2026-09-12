import { apiRequest } from './apiClient';
import { resolveEntityId } from './entityService';

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

export async function fetchBalances(entityId?: string): Promise<BalanceResponse> {
  const resolvedId = await resolveEntityId(entityId);
  if (!resolvedId) {
    return { balances: [] };
  }
  const data = await apiRequest<unknown>(`/balance/${encodeURIComponent(resolvedId)}`);
  if (isBalanceResponse(data)) return data;
  if (Array.isArray(data)) return { balances: data as BalanceItem[] };
  return { balances: [] };
}

function isBalanceResponse(value: unknown): value is BalanceResponse {
  return typeof value === 'object' && value !== null &&
    Array.isArray((value as { balances?: unknown }).balances);
}

