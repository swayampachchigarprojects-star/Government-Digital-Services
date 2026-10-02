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



