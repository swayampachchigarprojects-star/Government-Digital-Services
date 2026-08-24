import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchTransactions, Transaction } from '../services/transactionService';

interface TransactionsReportScreenProps {
  onBack: () => void;
}

export function TransactionsReportScreen({ onBack }: TransactionsReportScreenProps) {
  const { t } = useLanguage();

  // Filter States
  const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE' | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown / Datepicker Visibility
  const [entryDropdownVisible, setEntryDropdownVisible] = useState(false);
  const [fromDatePickerVisible, setFromDatePickerVisible] = useState(false);
  const [toDatePickerVisible, setToDatePickerVisible] = useState(false);

  // Validation Error States
  const [entryTypeError, setEntryTypeError] = useState('');
  const [fromDateError, setFromDateError] = useState('');
  const [toDateError, setToDateError] = useState('');

  // API Call States
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset results if filters are modified
  useEffect(() => {
    // Keep results visible, but we can clear error if they change filters
    if (apiError) setApiError(null);
  }, [entryType, fromDate, toDate]);

  const validateFilters = () => {
    let isValid = true;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);

    // 1. Entry Type
    if (!entryType) {
      setEntryTypeError(t('Entry Type is required'));
      isValid = false;
    } else {
      setEntryTypeError('');
    }

    // 2. From Date
    if (!fromDate) {
      setFromDateError(t('From Date is required'));
      isValid = false;
    } else {
      const fromDateObj = new Date(fromDate);
      if (fromDateObj > todayDate) {
        setFromDateError(t('From Date cannot be in the future'));
        isValid = false;
      } else {
        setFromDateError('');
      }
    }

    // 3. To Date
    if (!toDate) {
      setToDateError(t('To Date is required'));
      isValid = false;
    } else {
      const toDateObj = new Date(toDate);
      if (toDateObj > todayDate) {
        setToDateError(t('To Date cannot be in the future'));
        isValid = false;
      } else {
        setToDateError('');
      }
    }

    // 4. Date Range Comparison
    if (fromDate && toDate) {
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
      if (fromDateObj > toDateObj) {
        setFromDateError(t('From Date must be less than or equal to To Date'));
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSearchSubmit = async () => {
    if (!validateFilters()) {
      return;
    }

    try {
      setLoading(true);
      setApiError(null);
      setHasSearched(true);

      const filters = {
        entryType: entryType as 'INCOME' | 'EXPENSE',
        fromDate,
        toDate,
      };

      const results = await fetchTransactions(filters);
      setTransactions(results);
    } catch (error) {
      console.error('Transactions query error:', error);
      setTransactions([]);
      setApiError(t('Unable to fetch transactions. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Columns specification for results table
  const columns = [
    { key: 'id', title: t('Transaction ID'), width: 130 },
    { key: 'transactionType', title: t('Transaction Type'), width: 100 },
    { key: 'transactionHeadCode', title: t('Transaction Head'), width: 150 },
    { key: 'date', title: t('Date'), width: 110 },
    { key: 'amount', title: t('Amount'), width: 100 },
    { key: 'reference', title: t('Reference'), width: 130 },
    { key: 'remark', title: t('Remark'), width: 180 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.6}>
          <MaterialIcons name="arrow-back" size={24} color="#173B63" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('Transactions Report')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Filters Card */}
          <Text style={styles.sectionTitle}>{t('Select Filters')}</Text>
          <View style={styles.filtersCard}>
            {/* Entry Type Dropdown */}
            <CustomDropdown
              label={t('Entry Type')}
              value={entryType ? t(entryType) : ''}
              placeholder={t('Select Entry Type')}
              options={['Income', 'Expense']} // keys mapping to translations
              onSelect={(val) => {
                // val is translated, map it back to internal value
                if (val === t('Income') || val === 'Income') {
                  setEntryType('INCOME');
                } else if (val === t('Expense') || val === 'Expense') {
                  setEntryType('EXPENSE');
                }
                setEntryTypeError('');
              }}
              visible={entryDropdownVisible}
              setVisible={setEntryDropdownVisible}
              error={entryTypeError}
              modalTitle={t('Select Entry Type Modal Title')}
            />

            {/* Date Pickers Row */}
            <View style={styles.datePickerRow}>
              <View style={{ flex: 1 }}>
                <CustomDatePicker
                  label={t('From Date')}
                  value={fromDate}
                  placeholder={t('Select From Date')}
                  onSelect={(date) => {
                    setFromDate(date);
                    setFromDateError('');
                  }}
                  visible={fromDatePickerVisible}
                  setVisible={setFromDatePickerVisible}
                  error={fromDateError}
                  modalTitle={t('Select From Date Modal Title')}
                  maxDate={new Date()}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <CustomDatePicker
                  label={t('To Date')}
                  value={toDate}
                  placeholder={t('Select To Date')}
                  onSelect={(date) => {
                    setToDate(date);
                    setToDateError('');
                  }}
                  visible={toDatePickerVisible}
                  setVisible={setToDatePickerVisible}
                  error={toDateError}
                  modalTitle={t('Select To Date Modal Title')}
                  maxDate={new Date()}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSearchSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>{t('Submit')}</Text>
            </TouchableOpacity>
          </View>

          {/* Results Area */}
          {hasSearched && (
            <View style={styles.resultsContainer}>
              <Text style={styles.sectionTitle}>{t('Search Results')}</Text>

              {loading ? (
                /* Loading State */
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0B5CAD" />
                  <Text style={styles.loadingText}>{t('Loading')}</Text>
                </View>
              ) : apiError ? (
                /* API / Error State */
                <View style={styles.errorStateCard}>
                  {/* Warning banner */}
                  <View style={styles.warningBanner}>
                    <MaterialIcons name="info-outline" size={20} color="#0B5CAD" />
                    <Text style={styles.warningBannerText}>
                      {t('Data retrieval is pending backend API availability')}
                    </Text>
                  </View>
                  <View style={styles.errorSubContainer}>
                    <MaterialIcons name="error-outline" size={40} color="#EF4444" />
                    <Text style={styles.errorTextHeading}>{t('Error')}</Text>
                    <Text style={styles.errorTextDescription}>{apiError}</Text>
                  </View>
                </View>
              ) : transactions.length === 0 ? (
                /* Empty/No Results State */
                <View style={styles.emptyStateCard}>
                  {/* Warning banner showing pending state even for empty */}
                  <View style={styles.warningBanner}>
                    <MaterialIcons name="info-outline" size={20} color="#0B5CAD" />
                    <Text style={styles.warningBannerText}>
                      {t('Data retrieval is pending backend API availability')}
                    </Text>
                  </View>
                  <View style={styles.emptySubContainer}>
                    <MaterialIcons name="search-off" size={44} color="#BAC4D0" />
                    <Text style={styles.emptyText}>{t('No transactions found')}</Text>
                  </View>
                </View>
              ) : (
                /* Results Table State */
                <View style={styles.resultsCard}>
                  {/* Warning banner */}
                  <View style={[styles.warningBanner, { marginBottom: 16 }]}>
                    <MaterialIcons name="info-outline" size={20} color="#0B5CAD" />
                    <Text style={styles.warningBannerText}>
                      {t('Data retrieval is pending backend API availability')}
                    </Text>
                  </View>
                  
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                    <View style={styles.table}>
                      {/* Table Header */}
                      <View style={styles.tableHeaderRow}>
                        {columns.map((col) => (
                          <View key={col.key} style={[styles.tableHeaderCell, { width: col.width }]}>
                            <Text style={styles.tableHeaderCellText}>{col.title}</Text>
                          </View>
                        ))}
                      </View>
                      {/* Table Rows */}
                      {transactions.map((txn, index) => (
                        <View
                          key={txn.id || index}
                          style={[
                            styles.tableRow,
                            index % 2 === 1 && styles.tableRowAlternating,
                            index === transactions.length - 1 && styles.tableRowLast,
                          ]}
                        >
                          <View style={[styles.tableCell, { width: 130 }]}>
                            <Text style={styles.tableCellText} numberOfLines={1}>
                              {txn.id || '-'}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { width: 100 }]}>
                            <Text
                              style={[
                                styles.tableCellText,
                                {
                                  color: txn.transactionType === 'INCOME' ? '#10B981' : '#EF4444',
                                  fontWeight: '700',
                                },
                              ]}
                            >
                              {t(txn.transactionType)}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { width: 150 }]}>
                            <Text style={styles.tableCellText} numberOfLines={1}>
                              {t(txn.transactionHeadCode) || txn.transactionHeadCode || '-'}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { width: 110 }]}>
                            <Text style={styles.tableCellText}>{txn.date || '-'}</Text>
                          </View>
                          <View style={[styles.tableCell, { width: 100 }]}>
                            <Text
                              style={[
                                styles.tableCellText,
                                {
                                  color: txn.transactionType === 'INCOME' ? '#10B981' : '#EF4444',
                                  fontWeight: '700',
                                },
                              ]}
                            >
                              ₹ {txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { width: 130 }]}>
                            <Text style={styles.tableCellText} numberOfLines={1}>
                              {txn.reference || '-'}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, { width: 180 }]}>
                            <Text style={styles.tableCellText} numberOfLines={2}>
                              {txn.remark || '-'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}
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
  const { t } = useLanguage();
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
          <View style={styles.dropdownModalContent}>
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
                    value === t(option) && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(t(option));
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      value === t(option) && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {t(option)}
                  </Text>
                  {value === t(option) && (
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

/* Custom Calendar Picker Component */
interface CustomDatePickerProps {
  label: string;
  value: string;
  placeholder: string;
  onSelect: (date: string) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  error?: string;
  disabled?: boolean;
  modalTitle: string;
  maxDate?: Date;
}

function CustomDatePicker({
  label,
  value,
  placeholder,
  onSelect,
  visible,
  setVisible,
  error,
  disabled,
  modalTitle,
  maxDate,
}: CustomDatePickerProps) {
  const { t } = useLanguage();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (visible) {
      if (value) {
        const parts = value.split('-');
        if (parts.length === 3) {
          setCurrentYear(parseInt(parts[0], 10));
          setCurrentMonth(parseInt(parts[1], 10) - 1);
        }
      } else {
        const today = new Date();
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
      }
    }
  }, [visible, value]);

  const monthNames = [
    t('January'), t('February'), t('March'), t('April'),
    t('May'), t('June'), t('July'), t('August'),
    t('September'), t('October'), t('November'), t('December')
  ];

  const daysOfWeek = [
    t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (maxDate) {
      if (currentYear > maxDate.getFullYear() || 
         (currentYear === maxDate.getFullYear() && currentMonth >= maxDate.getMonth())) {
        return;
      }
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Grid layout calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0-indexed starting day

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ key: `blank-${i}`, dayNum: null });
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    cellDate.setHours(0, 0, 0, 0);
    const isFuture = maxDate && cellDate > todayDate;
    
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const isSelected = value === dateStr;

    calendarCells.push({
      key: `day-${d}`,
      dayNum: d,
      dateStr,
      isSelected,
      isFuture,
    });
  }

  // Visual display value formatting
  const getDisplayValue = () => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      // Return localized or formatted string
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${monthNames[mIdx]} ${y}`;
    }
    return value;
  };

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
          {getDisplayValue() || placeholder}
        </Text>
        <MaterialIcons name="date-range" size={22} color={disabled ? '#BAC4D0' : '#697788'} />
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
          <View style={styles.datePickerModalContent}>
            {/* Modal Header */}
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={24} color="#173B63" />
              </TouchableOpacity>
            </View>

            {/* Calendar Header Navigation */}
            <View style={styles.calendarNavHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                <MaterialIcons name="chevron-left" size={24} color="#0B5CAD" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                <MaterialIcons name="chevron-right" size={24} color="#0B5CAD" />
              </TouchableOpacity>
            </View>

            {/* Days of Week Header */}
            <View style={styles.weekHeadersRow}>
              {daysOfWeek.map((day, idx) => (
                <Text key={idx} style={styles.weekHeaderCell}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid cells */}
            <View style={styles.calendarGrid}>
              {calendarCells.map((cell) => {
                if (cell.dayNum === null) {
                  return <View key={cell.key} style={styles.calendarCellBlank} />;
                }
                return (
                  <TouchableOpacity
                    key={cell.key}
                    style={[
                      styles.calendarCell,
                      cell.isSelected && styles.calendarCellSelected,
                      cell.isFuture && styles.calendarCellDisabled,
                    ]}
                    disabled={cell.isFuture}
                    onPress={() => {
                      onSelect(cell.dateStr);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        cell.isSelected && styles.calendarCellTextSelected,
                        cell.isFuture && styles.calendarCellTextDisabled,
                      ]}
                    >
                      {cell.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D8E2EC',
    elevation: 2,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FA',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#173B63',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 420,
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
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  datePickerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
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
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultsContainer: {
    width: '100%',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    color: '#697788',
    fontSize: 14,
    fontWeight: '600',
  },
  errorStateCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  errorSubContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  errorTextHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173B63',
    marginTop: 8,
  },
  errorTextDescription: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  emptySubContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#697788',
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF6FC',
    borderColor: '#D0E2F5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    width: '100%',
  },
  warningBannerText: {
    color: '#0B5CAD',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
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
    height: 44,
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
    height: 52,
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
  tableCellText: {
    fontSize: 13,
    color: '#354052',
  },
  /* Input Control Dropdown & Picker Styling */
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
    maxHeight: '50%',
    paddingBottom: 24,
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    width: '100%',
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
  /* Calendar Layout Styles */
  calendarNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173B63',
  },
  weekHeadersRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  weekHeaderCell: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#697788',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 4,
  },
  calendarCellBlank: {
    width: '14.28%',
    height: 40,
  },
  calendarCellSelected: {
    backgroundColor: '#0B5CAD',
  },
  calendarCellDisabled: {
    backgroundColor: 'transparent',
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#173B63',
  },
  calendarCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarCellTextDisabled: {
    color: '#BAC4D0',
    textDecorationLine: 'line-through',
  },
});
