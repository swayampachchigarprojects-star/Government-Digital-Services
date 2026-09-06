import { apiRequest } from './apiClient';

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

export const DEFAULT_ENTITY_ID = 'c83b5222-7104-55bf-8b8c-2f17e4c31234';

export async function fetchBalances(entityId: string = DEFAULT_ENTITY_ID): Promise<BalanceResponse> {
  const data = await apiRequest<unknown>(`/balance/${entityId}`);
  if (isBalanceResponse(data)) return data;
  if (Array.isArray(data)) return { balances: data as BalanceItem[] };
  return { balances: [] };
}

function isBalanceResponse(value: unknown): value is BalanceResponse {
  return typeof value === 'object' && value !== null &&
    Array.isArray((value as { balances?: unknown }).balances);
}

