export interface Transaction {
  id: string;
  transactionType: 'INCOME' | 'EXPENSE';
  transactionHeadCode: string;
  transactionHeadName?: string;
  date: string;
  amount: number;
  reference?: string;
  remark?: string;
}

export interface TransactionFilters {
  entryType: 'INCOME' | 'EXPENSE';
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
}

import { apiRequest } from './apiClient';

export async function fetchTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const { entryType, fromDate, toDate } = filters;
  return apiRequest<Transaction[]>(`/transactions?transactionType=${encodeURIComponent(entryType)}&startDate=${encodeURIComponent(fromDate)}&endDate=${encodeURIComponent(toDate)}`);
}
