import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  createReportRequest,
  CreateReportRequestPayload,
  fetchReports,
  downloadReport,
  ReportItem,
} from '../services/transactionService';
import { ApiError } from '../services/apiClient';

interface TransactionsReportScreenProps {
  onBack: () => void;
}

/**
 * Returns dynamic Indian Financial Years (April to March)
 * Current FY + previous (count - 1) FYs (default 6 FYs total).
 * Format: `YYYY-YY` (e.g., `2026-27`).
 */
export function getFinancialYearOptions(count = 5): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 is Jan, 3 is Apr

  // In India, the FY starts on April 1 and ends on March 31.
  // If month is April (3) or later, the FY starts in currentYear.
  // If month is January to March (0 to 2), the FY starts in currentYear - 1.
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  const options: string[] = [];
  for (let i = 0; i < count; i++) {
    const fyStart = startYear - i;
    const fyEnd = fyStart + 1;
    const fyEndShort = String(fyEnd).slice(-2);
    options.push(`${fyStart}-${fyEndShort}`);
  }
  return options;
}

/**
 * Derives the Financial Year from `fromDate` and `toDate`
 * (e.g., `2025-04-01` to `2026-03-31` -> `2025-26`).
 */
export function deriveFinancialYear(fromDate?: string, toDate?: string): string {
  if (!fromDate && !toDate) return '-';

  const extractYear = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  };

  const fromYear = extractYear(fromDate);
  const toYear = extractYear(toDate);

  if (fromYear !== null && toYear !== null) {
    if (toYear > fromYear) {
      return `${fromYear}-${String(toYear).slice(-2)}`;
    } else {
      const monthMatch = fromDate?.match(/^\d{4}-(\d{2})/);
      const month = monthMatch ? parseInt(monthMatch[1], 10) : null;
      if (month && month < 4) {
        return `${fromYear - 1}-${String(fromYear).slice(-2)}`;
      }
      return `${fromYear}-${String(fromYear + 1).slice(-2)}`;
    }
  }

  if (fromYear !== null) {
    const monthMatch = fromDate?.match(/^\d{4}-(\d{2})/);
    const month = monthMatch ? parseInt(monthMatch[1], 10) : null;
    if (month && month < 4) {
      return `${fromYear - 1}-${String(fromYear).slice(-2)}`;
    }
    return `${fromYear}-${String(fromYear + 1).slice(-2)}`;
  }

  return '-';
}

export function TransactionsReportScreen({ onBack }: TransactionsReportScreenProps) {
  const { t } = useLanguage();

  // Financial Year Filter State
  const financialYearOptions = useMemo(() => getFinancialYearOptions(5), []);
  const [financialYear, setFinancialYear] = useState('');
  const [fyDropdownVisible, setFyDropdownVisible] = useState(false);
  const [financialYearError, setFinancialYearError] = useState('');

  // API Call States
  const [loading, setLoading] = useState(false);
  const [fetchingReports, setFetchingReports] = useState(true);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastVisible(true);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Fetch reports helper (Called on landing and after successful POST)
  const loadReports = async () => {
    try {
      setFetchingReports(true);
      const response = await fetchReports();
      if (response && Array.isArray(response.reports)) {
        setReports(response.reports);
      } else if (Array.isArray(response)) {
        setReports(response as unknown as ReportItem[]);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setFetchingReports(false);
    }
  };

  // Initial load of reports when user lands on screen
  useEffect(() => {
    loadReports();
  }, []);

  // Clear errors when filter changes
  useEffect(() => {
    if (apiError) setApiError(null);
    if (financialYearError) setFinancialYearError('');
  }, [financialYear]);

  const validateFilters = (): boolean => {
    if (!financialYear) {
      setFinancialYearError(t('Financial Year is required'));
      return false;
    }
    setFinancialYearError('');
    return true;
  };

  const handleSearchSubmit = async () => {
    if (!validateFilters()) {
      return;
    }

    try {
      setLoading(true);
      setApiError(null);

      // Convert selected FY (e.g., "2026-27") to Indian FY date range ("2026-04-01" to "2027-03-31")
      const startYear = parseInt(financialYear.split('-')[0].trim(), 10);
      const endYear = startYear + 1;
      const fromDate = `${startYear}-04-01`;
      const toDate = `${endYear}-03-31`;

      const payload: CreateReportRequestPayload = {
        fromDate,
        toDate,
      };

      const response = await createReportRequest(payload);

      if (response.status === 201 || response.status === 200) {
        // Show success toast
        triggerToast(t('Reports request has been submitted'));

        // Refresh reports list
        await loadReports();
      } else {
        throw new Error(t('The request could not be completed.'));
      }
    } catch (error) {
      console.error('Report request error:', error);
      const errorMessage =
        error instanceof ApiError && error.status === 0
          ? t('Unable to connect to the server. Please try again.')
          : error instanceof ApiError && error.status === 400
            ? t('The request could not be completed.')
            : error instanceof ApiError
              ? t(error.message) || error.message
              : error instanceof Error
                ? error.message
                : t('Unable to submit report request. Please try again.');

      setApiError(errorMessage);
      Alert.alert(t('Error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: ReportItem) => {
    try {
      setDownloadingReportId(report.reportId);
      await downloadReport(report.reportId);
      triggerToast(t('Report downloaded successfully'));
    } catch (error) {
      console.error('Download report error:', error);
      const errorMessage =
        error instanceof ApiError && error.status === 0
          ? t('Unable to connect to the server. Please try again.')
          : error instanceof ApiError && error.status === 404
            ? t('The requested report was not found.')
            : error instanceof ApiError
              ? t(error.message) || error.message
              : error instanceof Error
                ? error.message
                : t('Unable to download report. Please try again.');
      Alert.alert(t('Error'), errorMessage);
    } finally {
      setDownloadingReportId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Toast Alert */}
      {toastVisible && (
        <View style={styles.toastContainer}>
          <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Screen Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.6}>
              <MaterialIcons name="arrow-back" size={24} color="#173B63" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {t('Transactions Report')}
            </Text>
          </View>

          {/* Filters Card */}
          <View style={styles.filtersCard}>
            {/* <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>{t('Select Filters')}</Text>
            </View>
            <View style={styles.cardDivider} /> */}

            {/* Financial Year Dropdown */}
            <CustomDropdown
              label={t('Financial Year')}
              value={financialYear}
              placeholder={t('Select Financial Year')}
              options={financialYearOptions}
              onSelect={(val) => {
                setFinancialYear(val);
                setFinancialYearError('');
              }}
              visible={fyDropdownVisible}
              setVisible={setFyDropdownVisible}
              error={financialYearError}
              disabled={loading}
              modalTitle={t('Select Financial Year Modal Title')}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSearchSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t('Get Report')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Loading Indicator when landing on screen */}
          {fetchingReports && reports.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0B5CAD" />
              <Text style={styles.loadingText}>{t('Loading')}</Text>
            </View>
          ) : reports.length > 0 ? (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>{t('Reports')}</Text>
                </View>
                <View style={styles.cardDivider} />

                <View style={styles.table}>
                  {/* Table Header: 3 columns (F.Y., Status, Download) */}
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.tableHeaderCell, styles.colFy]}>
                      <Text style={styles.tableHeaderCellText}>{t('F.Y.')}</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.colStatus]}>
                      <Text style={[styles.tableHeaderCellText, styles.centerText]}>{t('Status')}</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.colDownload]}>
                      <Text style={[styles.tableHeaderCellText, styles.centerText]}>{t('Download')}</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {reports.map((report, index) => {
                    const isCompleted = report.status?.toUpperCase() === 'COMPLETED';
                    const isFailed = report.status?.toUpperCase() === 'FAILED';
                    const isDownloading = downloadingReportId === report.reportId;
                    return (
                      <View
                        key={report.reportId || index}
                        style={[
                          styles.tableRow,
                          index % 2 === 1 && styles.tableRowAlternating,
                          index === reports.length - 1 && styles.tableRowLast,
                        ]}
                      >
                        {/* 1. F.Y. */}
                        <View style={[styles.tableCell, styles.colFy]}>
                          <Text style={styles.tableCellTextBold}>
                            {deriveFinancialYear(report.fromDate, report.toDate)}
                          </Text>
                        </View>

                        {/* 2. Status */}
                        <View style={[styles.tableCell, styles.colStatus]}>
                          <View
                            style={[
                              styles.statusBadge,
                              isCompleted
                                ? styles.statusCompleted
                                : isFailed
                                  ? styles.statusFailed
                                  : styles.statusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isCompleted
                                  ? styles.statusTextCompleted
                                  : isFailed
                                    ? styles.statusTextFailed
                                    : styles.statusTextPending,
                              ]}
                              numberOfLines={1}
                            >
                              {t(report.status) || report.status}
                            </Text>
                          </View>
                        </View>

                        {/* 3. Download (Only shown when status === "COMPLETED") */}
                        <View style={[styles.tableCell, styles.colDownload]}>
                          {isCompleted ? (
                            <TouchableOpacity
                              style={[
                                styles.downloadBtn,
                                isDownloading && styles.downloadBtnLoading,
                                !!downloadingReportId && !isDownloading && styles.downloadBtnDisabled,
                              ]}
                              onPress={() => handleDownload(report)}
                              disabled={!!downloadingReportId}
                              activeOpacity={0.7}
                            >
                              {isDownloading ? (
                                <ActivityIndicator size="small" color="#0B5CAD" />
                              ) : (
                                <>
                                  <MaterialIcons name="file-download" size={16} color="#0B5CAD" />
                                  <Text style={styles.downloadBtnText}>{t('Download')}</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Custom Dropdown for filter selection */
interface CustomDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  error?: string;
  disabled?: boolean;
  modalTitle: string;
}

function CustomDropdown({
  label,
  value,
  placeholder,
  options,
  onSelect,
  visible,
  setVisible,
  error,
  disabled,
  modalTitle,
}: CustomDropdownProps) {
  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          visible && styles.dropdownTriggerActive,
          !!error && styles.dropdownTriggerError,
          disabled && styles.dropdownTriggerDisabled,
        ]}
        onPress={() => {
          if (!disabled) setVisible(true);
        }}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={disabled ? '#BAC4D0' : '#697788'} />
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={styles.dropdownModalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={24} color="#173B63" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownOptionsList} showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    value === option && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      value === option && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {value === option && (
                    <MaterialIcons name="check" size={20} color="#0B5CAD" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8E2EC',
    elevation: 2,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    color: '#173B63',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 720,
  },
  sectionTitle: {
    color: '#173B63',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  submitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    backgroundColor: '#0B5CAD',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultsContainer: {
    width: '100%',
    marginTop: 4,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  cardHeaderTitle: {
    color: '#173B63',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4EBF2',
    marginBottom: 20,
  },
  /* Tabular Layout */
  table: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#E4EBF2',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F7FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF2',
    minHeight: 44,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tableHeaderCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  tableHeaderCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#173B63',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF2',
    minHeight: 52,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlternating: {
    backgroundColor: '#F9FAFC',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  tableCellTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#173B63',
  },
  centerText: {
    textAlign: 'center',
  },
  /* 3 Columns Flex Layout */
  colFy: {
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  colStatus: {
    flex: 1.2,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colDownload: {
    flex: 1.1,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Status Badges */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  statusCompleted: {
    backgroundColor: '#DEF7EC',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusFailed: {
    backgroundColor: '#FDE8E8',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: '#03543F',
  },
  statusTextPending: {
    color: '#92400E',
  },
  statusTextFailed: {
    color: '#9B1C1C',
  },
  /* Download Button */
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF6FC',
    borderWidth: 1,
    borderColor: '#B9D7F2',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    minWidth: 80,
    minHeight: 32,
  },
  downloadBtnLoading: {
    opacity: 0.85,
  },
  downloadBtnDisabled: {
    opacity: 0.5,
  },
  downloadBtnText: {
    color: '#0B5CAD',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  loadingText: {
    color: '#697788',
    fontSize: 14,
    fontWeight: '600',
  },
  /* Toast Alert */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  /* Input Control Dropdown Styling */
  dropdownContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    color: '#354052',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownTrigger: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dropdownTriggerActive: {
    borderColor: '#0B5CAD',
  },
  dropdownTriggerError: {
    borderColor: '#E53E3E',
  },
  dropdownTriggerDisabled: {
    backgroundColor: '#F4F7FA',
    borderColor: '#E4EBF2',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#173B63',
  },
  dropdownPlaceholder: {
    color: '#8B96A5',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 30, 66, 0.4)',
    justifyContent: 'flex-end',
  },
  dropdownModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF2',
  },
  dropdownModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173B63',
  },
  dropdownOptionsList: {
    paddingHorizontal: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownOptionSelected: {
    backgroundColor: '#EEF6FC',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#173B63',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: '#0B5CAD',
    fontWeight: '600',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});
