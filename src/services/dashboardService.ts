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

const BASE_URL = 'http://192.168.0.248:8080/';
export const DEFAULT_ENTITY_ID = 'c83b5222-7104-55bf-8b8c-2f17e4c31234';

export async function fetchBalances(entityId: string = DEFAULT_ENTITY_ID): Promise<BalanceResponse> {
  const cleanBaseUrl = BASE_URL.replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/balance/${entityId}`;
  
  console.log('Fetching balances from API:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.balances)) {
        return data;
      }
      if (Array.isArray(data)) {
        return { balances: data };
      }
      return { balances: [] };
    }

    // Fallback: If 404 occurs on /api/v1/balance/..., attempt root endpoint /balance/...
    if (response.status === 404) {
      const rootUrl = `http://192.168.0.248:8080/balance/${entityId}`;
      console.log('Attempting fallback root URL:', rootUrl);
      const fallbackResponse = await fetch(rootUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data && Array.isArray(data.balances)) {
          return data;
        }
        if (Array.isArray(data)) {
          return { balances: data };
        }
        return { balances: [] };
      }
    }

    throw new Error(`HTTP error! status: ${response.status}`);
  } catch (error) {
    console.error('Error fetching balance from API:', error);
    throw error;
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary');
}
