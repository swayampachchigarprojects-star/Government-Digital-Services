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

export interface ServicesTransaction {
  id?: string;
  transactionType: 'INCOME' | 'EXPENSE' | string;
  transactionHead?: string;
  transactionHeadCode?: string;
  transactionHeadName?: string;
  amount: number;
  date?: string;
  reference?: string;
  remark?: string;
}

export interface GetTransactionsByDateResponse {
  transactions?: ServicesTransaction[];
}

export async function fetchTransactionsByDate(date: string): Promise<ServicesTransaction[]> {
  const res = await apiRequest<GetTransactionsByDateResponse | ServicesTransaction[]>(
    `/transactions?date=${encodeURIComponent(date)}`
  );

  if (Array.isArray(res)) {
    return res;
  }
  if (res && Array.isArray(res.transactions)) {
    return res.transactions;
  }
  return [];
}

export interface PaymentType {
  paymentTypeId: string;
  paymentTypeValue: string;
}

export interface PaymentTypesResponse {
  paymentTypes: PaymentType[];
}

export async function fetchPaymentTypes(
  accountingEntityId = 'c83b5222-7104-55bf-8b8c-2f17e4c31234'
): Promise<PaymentType[]> {
  const data = await apiRequest<PaymentTypesResponse>(
    `/payment-types/${encodeURIComponent(accountingEntityId)}`
  );
  return data?.paymentTypes || [];
}


