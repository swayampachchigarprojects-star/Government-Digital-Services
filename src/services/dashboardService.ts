export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
}

import { apiRequest } from './apiClient';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary');
}
