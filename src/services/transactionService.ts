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

import { apiRequest, apiRequestWithResponse } from './apiClient';
import { resolveEntityId } from './entityService';

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
  paymentType: string;
  name?: string;
  balance?: number;
  [key: string]: unknown;
}

export interface PaymentTypesResponse {
  paymentTypes: PaymentType[];
}

export async function fetchPaymentTypes(
  accountingEntityId?: string
): Promise<PaymentType[]> {
  const resolvedId = await resolveEntityId(accountingEntityId);
  if (!resolvedId) {
    return [];
  }
  const data = await apiRequest<PaymentTypesResponse>(
    `/payment-types/${encodeURIComponent(resolvedId)}`
  );
  return data?.paymentTypes || [];
}

export interface CreateReportRequestPayload {
  fromDate: string;
  toDate: string;
  transactionType?: string;
}

export async function createReportRequest(
  payload: CreateReportRequestPayload
): Promise<{ status: number; data: unknown }> {
  const body: Record<string, unknown> = {
    fromDate: payload.fromDate,
    toDate: payload.toDate,
  };
  if (payload.transactionType) {
    body.transactionType = payload.transactionType;
  }

  return apiRequestWithResponse<unknown>('/report-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}



