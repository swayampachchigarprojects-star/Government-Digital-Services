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

import { PermissionsAndroid, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
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

const REPORT_FILENAME = 'lekha-report.pdf';

function getDownloadUrl(data: unknown, baseUrl: string): URL | null {
  if (!data || typeof data !== 'object') return null;

  const reportData = data as Record<string, unknown>;
  const rawUrl = reportData.downloadUrl ?? reportData.url ?? reportData.fileUrl;
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;

  let downloadUrl: URL;
  try {
    downloadUrl = new URL(rawUrl, baseUrl);
  } catch (error) {
    throw new ApiError(200, 'The report download URL is invalid.', error);
  }
  if (downloadUrl.protocol !== 'https:' && downloadUrl.protocol !== 'http:') {
    throw new ApiError(200, 'The report download URL is invalid.');
  }
  return downloadUrl;
}

async function downloadReportToAndroidDownloads(
  url: string,
  headers: Record<string, string>,
  allowSignedUrl = true,
): Promise<void> {
  const ReactNativeBlobUtil = (await import('react-native-blob-util')).default;
  // Use an epoch timestamp to make temporary staging files easy to identify.
  const tempFilename = `lekha-report-${Date.now()}.tmp`;
  const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${tempFilename}`;
  let response;
  try {
    response = await ReactNativeBlobUtil.config({ path: tempPath }).fetch('GET', url, headers);
  } catch (error) {
    let cleanupError: unknown;
    try {
      await ReactNativeBlobUtil.fs.unlink(tempPath);
    } catch (unlinkError) {
      cleanupError = unlinkError;
    }
    throw new ApiError(
      0,
      'Unable to connect to the server. Please try again.',
      { requestError: error, cleanupError },
    );
  }

  if (!response.ok) {
    let errorDetails: unknown;
    try {
      const errorText = await response.text();
      if (errorText) {
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = errorText;
        }
      }
    } finally {
      await response.flush();
    }
    throw new ApiError(response.status, 'The report could not be downloaded.', errorDetails);
  }

  const contentType = response.headers['content-type'] || '';
  if (contentType.toLowerCase().includes('json')) {
    let downloadUrl: URL | null;
    try {
      let data: unknown;
      try {
        data = await response.json();
      } catch (error) {
        throw new ApiError(
          response.status,
          'The report response did not contain a downloadable file.',
          error,
        );
      }
      downloadUrl = getDownloadUrl(data, url);
    } finally {
      await response.flush();
    }

    if (!allowSignedUrl || !downloadUrl) {
      throw new ApiError(response.status, 'The report response did not contain a downloadable file.');
    }

    const apiOrigin = new URL(config.apiBaseUrl).origin;
    const signedUrlHeaders: Record<string, string> = {};
    // Signed URLs on other hosts must not receive the API bearer token.
    if (downloadUrl.origin === apiOrigin && headers.Authorization) {
      signedUrlHeaders.Authorization = headers.Authorization;
    }
    await downloadReportToAndroidDownloads(downloadUrl.href, signedUrlHeaders, false);
    return;
  }

  const path = response.path();
  if (!path) {
    await response.flush();
    throw new ApiError(response.status, 'The report could not be saved.');
  }

  try {
    const mime = contentType.split(';', 1)[0].trim() || 'application/pdf';
    const androidVersion = Number(Platform.Version);
    // Legacy external storage needs runtime permission; scoped storage does not.
    if (androidVersion >= 23 && androidVersion < 29) {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        const message = permission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
          ? 'Please enable storage permission in Settings to save reports.'
          : 'Storage permission is required to save reports.';
        throw new ApiError(403, message);
      }
    }
    try {
      // Copy from private cache into the user's public Downloads collection.
      await ReactNativeBlobUtil.media.copyToMediaStore(
        { name: REPORT_FILENAME, parentFolder: '', mime },
        'Download',
        path,
      );
    } catch (error) {
      throw new ApiError(500, 'The report could not be saved.', error);
    }
  } finally {
    await response.flush();
  }
}

export async function downloadReport(reportId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError(401, 'You are not authorized to perform this action.');
  }

  const url = `${config.apiBaseUrl}/reports/${encodeURIComponent(reportId)}/download`;

  const headers: Record<string, string> = {
    Accept: 'application/pdf, application/json, */*',
    Authorization: `Bearer ${token}`,
  };

  if (Platform.OS === 'android') {
    await downloadReportToAndroidDownloads(url, headers);
    return;
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
      const errorText = await response.text();
      try {
        errorDetails = errorText ? JSON.parse(errorText) : undefined;
      } catch {
        errorDetails = errorText || undefined;
      }
    } catch {
      errorDetails = undefined;
    }
    throw new ApiError(response.status, 'The report could not be downloaded.', errorDetails);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('json')) {
    const data = await response.json();
    const downloadUrl = getDownloadUrl(data, url);
    if (!downloadUrl) {
      throw new ApiError(response.status, 'The report response did not contain a downloadable file.');
    }

    if (Platform.OS === 'web') {
      window.location.assign(downloadUrl.href);
      return;
    }

    const signedHeaders: Record<string, string> = {};
    if (downloadUrl.origin === new URL(config.apiBaseUrl).origin) {
      signedHeaders.Authorization = `Bearer ${token}`;
    }
    try {
      response = await fetch(downloadUrl.href, { headers: signedHeaders });
    } catch {
      throw new ApiError(0, 'Unable to connect to the server. Please try again.');
    }
    if (!response.ok) {
      throw new ApiError(response.status, 'The report could not be downloaded.');
    }
  }

  const filename = REPORT_FILENAME;

  if (Platform.OS === 'web') {
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } else {
    const file = new File(Paths.document, filename);
    file.create({ intermediates: true, overwrite: true });
    file.write(new Uint8Array(await response.arrayBuffer()));
  }
}
