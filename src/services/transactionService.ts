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

import { Platform, Linking } from 'react-native';
import { config } from '../config';
import { apiRequest, apiRequestWithResponse, getAuthToken, ApiError } from './apiClient';
import { resolveEntityId, getCachedEntityData } from './entityService';

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

let cachedPaymentTypes: PaymentType[] | null = null;

export function getCachedPaymentTypes(): PaymentType[] | null {
  return cachedPaymentTypes;
}

export function setCachedPaymentTypes(types: PaymentType[] | null): void {
  cachedPaymentTypes = types;
}

export function clearPaymentTypesCache(): void {
  cachedPaymentTypes = null;
}

export function normalizePaymentTypes(rawList: unknown): PaymentType[] {
  if (!Array.isArray(rawList)) return [];
  const results: PaymentType[] = [];
  for (let index = 0; index < rawList.length; index++) {
    const item = rawList[index];
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed) {
        results.push({
          paymentTypeId: `pt-${trimmed}-${index}`,
          paymentType: trimmed,
          name: trimmed,
        });
      }
      continue;
    }
    if (typeof item !== 'object' || item === null) continue;
    const rec = item as Record<string, unknown>;
    const paymentType =
      (typeof rec.paymentType === 'string' && rec.paymentType.trim()) ||
      (typeof rec.paymentTypeName === 'string' && rec.paymentTypeName.trim()) ||
      (typeof rec.name === 'string' && rec.name.trim()) ||
      (typeof rec.type === 'string' && rec.type.trim()) ||
      '';
    if (!paymentType) continue;

    const paymentTypeId =
      (typeof rec.paymentTypeId === 'string' && rec.paymentTypeId.trim()) ||
      (typeof rec.id === 'string' && rec.id.trim()) ||
      (typeof rec._id === 'string' && rec._id.trim()) ||
      `pt-${paymentType}-${index}`;

    const balance =
      typeof rec.balance === 'number'
        ? rec.balance
        : typeof rec.balValue === 'number'
          ? rec.balValue
          : typeof rec.amount === 'number'
            ? rec.amount
            : typeof rec.openingBalance === 'number'
              ? rec.openingBalance
              : typeof rec.balance === 'string' && !isNaN(Number(rec.balance))
                ? Number(rec.balance)
                : typeof rec.openingBalance === 'string' && !isNaN(Number(rec.openingBalance))
                  ? Number(rec.openingBalance)
                  : undefined;

    results.push({
      ...rec,
      paymentTypeId,
      paymentType,
      name: paymentType,
      balance,
    });
  }
  return results;
}

export async function fetchPaymentTypes(
  accountingEntityId?: string,
  forceRefresh = false
): Promise<PaymentType[]> {
  if (cachedPaymentTypes && cachedPaymentTypes.length > 0 && !forceRefresh && !accountingEntityId) {
    return cachedPaymentTypes;
  }
  const resolvedId = await resolveEntityId(accountingEntityId);
  if (!resolvedId) {
    const entityData = getCachedEntityData();
    if (entityData && Array.isArray(entityData.paymentTypes) && entityData.paymentTypes.length > 0) {
      const fallbackList = normalizePaymentTypes(entityData.paymentTypes);
      if (fallbackList.length > 0) {
        cachedPaymentTypes = fallbackList;
        return fallbackList;
      }
    }
    return cachedPaymentTypes || [];
  }
  try {
    const data = await apiRequest<unknown>(
      `/payment-types/${encodeURIComponent(resolvedId)}`
    );
    let list: PaymentType[] = [];
    if (Array.isArray(data)) {
      list = normalizePaymentTypes(data);
    } else if (typeof data === 'object' && data !== null) {
      const rec = data as Record<string, unknown>;
      if (Array.isArray(rec.paymentTypes)) {
        list = normalizePaymentTypes(rec.paymentTypes);
      } else if (Array.isArray(rec.data)) {
        list = normalizePaymentTypes(rec.data);
      }
    }

    if (list.length === 0) {
      const entityData = getCachedEntityData();
      if (entityData && Array.isArray(entityData.paymentTypes) && entityData.paymentTypes.length > 0) {
        list = normalizePaymentTypes(entityData.paymentTypes);
      }
    }

    if (list.length > 0) {
      cachedPaymentTypes = list;
    }
    return list.length > 0 ? list : (cachedPaymentTypes || []);
  } catch (err) {
    if (__DEV__) {
      console.warn('[transactionService] Failed to fetch payment types:', err);
    }
    const entityData = getCachedEntityData();
    if (entityData && Array.isArray(entityData.paymentTypes) && entityData.paymentTypes.length > 0) {
      const fallbackList = normalizePaymentTypes(entityData.paymentTypes);
      if (fallbackList.length > 0) {
        cachedPaymentTypes = fallbackList;
        return fallbackList;
      }
    }
    return cachedPaymentTypes || [];
  }
}

export interface CreateReportRequestPayload {
  fromDate: string;
  toDate: string;
  transactionType?: string;
}

export type ReportPayload = CreateReportRequestPayload;

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

  return apiRequestWithResponse<unknown>('/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export const createReport = createReportRequest;

export interface ReportItem {
  reportId: string;
  fromDate: string;
  toDate: string;
  status: string;
  createdAt?: string;
  downloadUrl?: string;
  [key: string]: unknown;
}

export interface GetReportsResponse {
  reports: ReportItem[];
}

export async function fetchReports(): Promise<GetReportsResponse> {
  const data = await apiRequest<GetReportsResponse | ReportItem[]>('/reports');
  if (Array.isArray(data)) {
    return { reports: data };
  }
  if (data && Array.isArray(data.reports)) {
    return data;
  }
  return { reports: [] };
}

export async function downloadReport(reportId: string): Promise<void> {
  const token = getAuthToken();
  const url = `${config.apiBaseUrl}/reports/${encodeURIComponent(reportId)}/download`;

  const headers: Record<string, string> = {
    Accept: '*/*',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers,
    });
  } catch (err) {
    throw new ApiError(0, 'Unable to connect to the server. Please try again.');
  }

  if (!response.ok) {
    let errorDetails: unknown;
    try {
      errorDetails = await response.json();
    } catch {
      errorDetails = undefined;
    }
    throw new ApiError(response.status, 'The report could not be downloaded.', errorDetails);
  }

  const contentType = response.headers.get('content-type') || '';

  // Case 1: Response contains JSON with a direct download/signed URL
  if (contentType.includes('application/json')) {
    const data = await response.json();
    const downloadUrl = (data && (data.downloadUrl || data.url || data.fileUrl)) as string | undefined;
    if (downloadUrl && typeof downloadUrl === 'string') {
      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
      } else {
        await Linking.openURL(downloadUrl);
      }
      return;
    }
  }

  // Case 2: Binary stream / file download
  if (Platform.OS === 'web') {
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;

    let filename = `report-${reportId}.pdf`;
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      }
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } else {
    // React Native Mobile
    const mobileUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    const canOpen = await Linking.canOpenURL(mobileUrl);
    if (canOpen) {
      await Linking.openURL(mobileUrl);
    } else {
      await Linking.openURL(url);
    }
  }
}



