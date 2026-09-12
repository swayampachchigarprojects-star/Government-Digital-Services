import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { apiRequest } from '../services/apiClient';
import { fetchPaymentTypes, PaymentType } from '../services/transactionService';

interface IncomeEntryScreenProps {
  onBack: () => void;
}


interface TransactionResponse {
  txnHeads: TransactionHead[];
}

// this interface is to support API call
interface TransactionHead {
  txnCode: string;
  txnName: string;
}

interface TxnCreationRequest {
  transactionType: 'INCOME' | 'EXPENSE';
  transactionHeadCode: string;
  date: string;
  amount: number;
  paymentTypeId: string;
  reference?: string;
  remark?: string;
}

// Custom dropdown data mapping
const incomeData: Record<string, string[]> = {
  'Tax Collection': ['Property Tax', 'Water Tax', 'Professional Tax', 'Land Revenue'],
  'Government Grants': ['Development Grant', 'Education Grant', 'Health Sector Grant', 'Social Welfare Grant'],
  'Service Fees': ['Certificate Issuance', 'NOC Fees', 'Building Permission', 'Registry Fees'],
  'Miscellaneous': ['Donations', 'Interest Income', 'Auction Receipts', 'Other Fees'],
};

export function IncomeEntryScreen({ onBack }: IncomeEntryScreenProps) {
  const { t } = useLanguage();

  // Input fields
  const [incomeType, setIncomeType] = useState('');
  const [incomeSubtypeNames, setIncomeSubtypeNames] = useState<string[]>([]);
  const [incomeSubtypeCodes, setIncomeSubtypeCodes] = useState<string[]>([]);
  const [subtypeAmounts, setSubtypeAmounts] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState('');
  const [refId, setRefId] = useState('');

  // Submit API state
  const [submitting, setSubmitting] = useState(false);

  // Dropdown visibility - this is for static value visibility
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [subtypeDropdownVisible, setSubtypeDropdownVisible] = useState(false);

  //this is for api response
  const [incomeTypes, setIncomeTypes] = useState<TransactionHead[]>([]);
  const [loadingIncomeTypes, setLoadingIncomeTypes] = useState(false);

  const [incomeSubTypes, setIncomeSubTypes] = useState<TransactionHead[]>([]);
  const [loadingIncomeSubTypes, setLoadingIncomeSubTypes] = useState(false);

  // Payment Type state
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loadingPaymentTypes, setLoadingPaymentTypes] = useState(false);
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [paymentTypeError, setPaymentTypeError] = useState('');
  const [paymentTypeDropdownVisible, setPaymentTypeDropdownVisible] = useState(false);

  // Fetch Income Types
  const fetchIncomeTypes = async () => {
    try {
      setLoadingIncomeTypes(true);

      const data = await apiRequest<TransactionResponse>(
        '/transaction-heads?transactionType=INCOME&level=1'
      );

      setIncomeTypes(data?.txnHeads || []);
    } catch (error) {
      console.error('Failed to fetch Income Types:', error);

      Alert.alert(
        t('Error'),
        t('Unable to load Income Types. Please try again.')
      );
    } finally {
      setLoadingIncomeTypes(false);
    }
  };

  // Fetch Payment Types
  const loadPaymentTypes = async () => {
    try {
      setLoadingPaymentTypes(true);

      const data = await fetchPaymentTypes();
      setPaymentTypes(data);
    } catch (error) {
      console.error('Failed to fetch Payment Types:', error);

      setPaymentTypes([]);

      Alert.alert(
        t('Error'),
        t('Unable to load Payment Types. Please try again.')
      );
    } finally {
      setLoadingPaymentTypes(false);
    }
  };

  // Fetch Income Sub types
  const fetchIncomeSubTypes = async (primaryHeadCode: string) => {
    try {
      setLoadingIncomeSubTypes(true);

      const data = await apiRequest<TransactionResponse>(
        `/transaction-heads?transactionType=INCOME&precedingHeadCode=${encodeURIComponent(primaryHeadCode)}&level=2`
      );

      setIncomeSubTypes(data?.txnHeads || []);
    } catch (error) {
      console.error('Failed to fetch Income Sub Entries:', error);

      setIncomeSubTypes([]);

      Alert.alert(
        t('Error'),
        t('Unable to load Income Sub Entries. Please try again.')
      );
    } finally {
      setLoadingIncomeSubTypes(false);
    }
  };

  // Submit Income Entry
  const submitIncomeEntry = async () => {
    try {
      setSubmitting(true);

      const incomeEntryPayload = {
        entries: incomeSubtypeCodes.map((code) => {
          const item: TxnCreationRequest = {
            transactionType: 'INCOME',
            transactionHeadCode: code,
            date: new Date().toISOString().split('T')[0],
            amount: parseFloat(subtypeAmounts[code] || '0'),
            paymentTypeId: paymentTypeId,
          };
          if (refId) item.reference = refId;
          if (remarks) item.remark = remarks;
          return item;
        })
      }

      return apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(incomeEntryPayload),
      });
    } catch (error) {
      console.error('Failed to submit Income Entry:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Focus states
  const [focusedAmountCode, setFocusedAmountCode] = useState<string | null>(null);
  const [isRemarksFocused, setIsRemarksFocused] = useState(false);
  const [isRefIdFocused, setIsRefIdFocused] = useState(false);

  // Errors
  const [typeError, setTypeError] = useState('');
  const [subtypeError, setSubtypeError] = useState('');
  const [amountErrors, setAmountErrors] = useState<Record<string, string>>({});

  // Modal and Toast States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Update subtypes and clear amounts when type changes
  useEffect(() => {
    setIncomeSubtypeNames([]);
    setIncomeSubtypeCodes([]);
    setSubtypeAmounts({});
    setAmountErrors({});
    setSubtypeError('');
  }, [incomeType]);

  // Fetch Income Types and Payment Types when screen loads
  useEffect(() => {
    fetchIncomeTypes();
    loadPaymentTypes();
  }, []);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const handleSubtypeAmountChange = (code: string, text: string) => {
    // Only allow positive numbers with up to 2 decimal points
    if (text === '' || /^\d+\.?\d{0,2}$/.test(text)) {
      setSubtypeAmounts((prev) => ({
        ...prev,
        [code]: text,
      }));
      if (amountErrors[code]) {
        setAmountErrors((prev) => {
          const next = { ...prev };
          delete next[code];
          return next;
        });
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    if (!incomeType) {
      setTypeError(t('Income Type is required'));
      isValid = false;
    } else {
      setTypeError('');
    }

    if (incomeSubtypeCodes.length === 0) {
      setSubtypeError(t('Income Subtype is required'));
      isValid = false;
    } else {
      setSubtypeError('');
    }

    const nextAmountErrors: Record<string, string> = {};
    for (const code of incomeSubtypeCodes) {
      const val = subtypeAmounts[code];
      const amtVal = parseFloat(val);
      if (!val || val.trim() === '') {
        nextAmountErrors[code] = t('Amount is required');
        isValid = false;
      } else if (isNaN(amtVal) || amtVal <= 0) {
        nextAmountErrors[code] = t('Amount must be a positive number greater than 0');
        isValid = false;
      }
    }
    setAmountErrors(nextAmountErrors);
    if (Object.keys(nextAmountErrors).length > 0) {
      isValid = false;
    }

    if (!paymentTypeId) {
      setPaymentTypeError(t('Payment Type is required'));
      isValid = false;
    } else {
      setPaymentTypeError('');
    }

    return isValid;
  };

  const handleSubmitPress = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  // A final submit from pop-up which calls API and submit the Income Entry
  const handleFinalSubmit = async () => {
    try {
      await submitIncomeEntry();

      // Close confirmation popup only after successful API call
      setShowConfirmModal(false);

      // Clear form inputs
      setIncomeType('');
      setIncomeSubtypeNames([]);
      setIncomeSubtypeCodes([]);
      setIncomeSubTypes([]);
      setSubtypeAmounts({});
      setPaymentTypeId('');
      setRemarks('');
      setRefId('');

      // Clear validation errors
      setTypeError('');
      setSubtypeError('');
      setAmountErrors({});
      setPaymentTypeError('');

      // Show success message
      triggerToast(
        t('Success! Income entry has been recorded successfully.')
      );
    } catch (error) {
      Alert.alert(
        t('Submission Failed'),
        t('Unable to submit the Income Entry. Please try again.')
      );
    }
  };

  const totalAmount = incomeSubtypeCodes.reduce((sum, code) => {
    const val = parseFloat(subtypeAmounts[code] || '0');
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const selectedPaymentType = paymentTypes.find((pt) => pt.paymentTypeId === paymentTypeId);

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.headerTitle}>{t('Income Entry')}</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>

            {/* Income Type Dropdown */}
            <CustomDropdown
              label={t('Income Type')}
              value={incomeType ? t(incomeType) : ''}
              placeholder={
                loadingIncomeTypes
                  ? t('Loading Income Types...')
                  : t('Select Income Type')
              }
              options={incomeTypes.map((item) => t(item.txnName))}
              onSelect={(val) => {
                const selectedType = incomeTypes.find(
                  (item) => t(item.txnName) === val
                );

                if (selectedType) {
                  setIncomeType(selectedType.txnName);
                  setIncomeSubtypeNames([]);
                  setIncomeSubtypeCodes([]);
                  setIncomeSubTypes([]);
                  setTypeError('');
                  setSubtypeError('');

                  if (selectedType.txnCode) {
                    fetchIncomeSubTypes(selectedType.txnCode);
                  }
                }
              }}
              visible={typeDropdownVisible}
              setVisible={setTypeDropdownVisible}
              error={typeError}
              modalTitle={t('Select Income Type Modal Title')}
            />

            {/* Income Subtype Dropdown */}
            <CustomDropdown
              label={t('Income Sub Entry')}
              value={incomeSubtypeNames.map((name) => t(name)).join(', ')}
              placeholder={
                loadingIncomeSubTypes
                  ? t('Loading Income Sub Entries...')
                  : t('Select Income Sub Entry')
              }
              options={incomeSubTypes.map((item) => ({
                label: t(item.txnName),
                value: item.txnCode,
              }))}
              multiSelect={true}
              selectedValues={incomeSubtypeCodes}
              onMultiSelectChange={(newCodes) => {
                setIncomeSubtypeCodes(newCodes);
                const newNames = incomeSubTypes
                  .filter((item) => newCodes.includes(item.txnCode))
                  .map((item) => item.txnName);
                setIncomeSubtypeNames(newNames);
                if (newCodes.length > 0) {
                  setSubtypeError('');
                }

                // Immediately synchronize amounts: preserve existing values for remaining codes, drop removed
                setSubtypeAmounts((prev) => {
                  const updated: Record<string, string> = {};
                  for (const code of newCodes) {
                    if (prev[code] !== undefined) {
                      updated[code] = prev[code];
                    }
                  }
                  return updated;
                });

                // Clear errors for removed codes
                setAmountErrors((prev) => {
                  const updated: Record<string, string> = {};
                  for (const code of newCodes) {
                    if (prev[code]) {
                      updated[code] = prev[code];
                    }
                  }
                  return updated;
                });
              }}
              doneButtonText={t('Done')}
              visible={subtypeDropdownVisible}
              setVisible={setSubtypeDropdownVisible}
              error={subtypeError}
              modalTitle={t('Select Income Sub Entry Modal Title')}
            />

            {/* Dynamic Amount Inputs per selected subtype */}
            {incomeSubtypeCodes.map((code) => {
              const subtype = incomeSubTypes.find((item) => item.txnCode === code);
              const displayName = subtype ? t(subtype.txnName) : code;
              const isFocused = focusedAmountCode === code;
              const error = amountErrors[code];

              return (
                <View key={code} style={styles.formGroup}>
                  <Text style={styles.label}>
                    {`${t('Amount (₹)')} — ${displayName}`}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFocused && styles.inputFocused,
                      !!error && styles.inputError,
                    ]}
                    value={subtypeAmounts[code] || ''}
                    onChangeText={(text) => handleSubtypeAmountChange(code, text)}
                    placeholder={t('Enter amount (e.g. 1500.50)')}
                    placeholderTextColor="#8B96A5"
                    keyboardType="decimal-pad"
                    onFocus={() => setFocusedAmountCode(code)}
                    onBlur={() => {
                      if (focusedAmountCode === code) {
                        setFocusedAmountCode(null);
                      }
                    }}
                  />
                  {!!error && <Text style={styles.errorText}>{error}</Text>}
                </View>
              );
            })}

            {/* Payment Type Dropdown */}
            <CustomDropdown
              label={t('Payment Type')}
              value={
                selectedPaymentType
                  ? t(selectedPaymentType.paymentType || selectedPaymentType.name || '') ||
                    selectedPaymentType.paymentType ||
                    selectedPaymentType.name ||
                    ''
                  : ''
              }
              placeholder={
                loadingPaymentTypes
                  ? t('Loading Payment Types...')
                  : t('Select Payment Type')
              }
              options={paymentTypes.map((item) => {
                const label = item.paymentType || item.name || '';
                return {
                  label: t(label) || label,
                  value: item.paymentTypeId,
                };
              })}
              onSelect={(val) => {
                setPaymentTypeId(val);
                setPaymentTypeError('');
              }}
              visible={paymentTypeDropdownVisible}
              setVisible={setPaymentTypeDropdownVisible}
              error={paymentTypeError}
              disabled={loadingPaymentTypes}
              modalTitle={t('Select Payment Type Modal Title')}
            />

            {/* Remarks Text Area */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('Remarks (Optional)')}</Text>
                <Text style={styles.counterText}>{remarks.length} / 300</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  isRemarksFocused && styles.inputFocused,
                ]}
                value={remarks}
                onChangeText={(text) => setRemarks(text.substring(0, 300))}
                placeholder={t('Add contextual notes or remarks...')}
                placeholderTextColor="#8B96A5"
                multiline={true}
                numberOfLines={4}
                maxLength={300}
                textAlignVertical="top"
                onFocus={() => setIsRemarksFocused(true)}
                onBlur={() => setIsRemarksFocused(false)}
              />
            </View>

            {/* Reference ID Input */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('Reference ID (Optional)')}</Text>
                <Text style={styles.counterText}>{refId.length} / 100</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isRefIdFocused && styles.inputFocused,
                ]}
                value={refId}
                onChangeText={(text) => setRefId(text.substring(0, 100))}
                placeholder={t('e.g. TXN-10824982')}
                placeholderTextColor="#8B96A5"
                maxLength={100}
                autoCapitalize="characters"
                onFocus={() => setIsRefIdFocused(true)}
                onBlur={() => setIsRefIdFocused(false)}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitPress}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>{t('Submit Entry')}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('Confirm Income Entry')}</Text>
            <Text style={styles.modalSubtitle}>{t('Please verify the transaction details below before committing to database.')}</Text>

            <View style={styles.modalDetails}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('Income Type')}</Text>
                <Text style={styles.modalValue}>{t(incomeType)}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('Income Subtype')}</Text>
                <Text style={styles.modalValue}>
                  {incomeSubtypeNames.map((name) => t(name)).join(', ')}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('Amount')}</Text>
                {incomeSubtypeCodes.length === 1 ? (
                  <Text style={styles.modalAmount}>
                    ₹ {(parseFloat(subtypeAmounts[incomeSubtypeCodes[0]] || '0') || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                ) : (
                  <View style={styles.modalSubtypeAmountList}>
                    {incomeSubtypeCodes.map((code) => {
                      const subtype = incomeSubTypes.find((item) => item.txnCode === code);
                      const displayName = subtype ? t(subtype.txnName) : code;
                      const amtVal = parseFloat(subtypeAmounts[code] || '0') || 0;
                      return (
                        <View key={code} style={styles.modalSubtypeRow}>
                          <Text style={styles.modalSubtypeLabel}>{displayName}</Text>
                          <Text style={styles.modalSubtypeAmount}>
                            ₹ {amtVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                      );
                    })}
                    <View style={[styles.modalSubtypeRow, styles.modalTotalRow]}>
                      <Text style={[styles.modalSubtypeLabel, styles.modalTotalLabel]}>
                        {t('Total Balance')}
                      </Text>
                      <Text style={[styles.modalAmount, styles.modalTotalAmount]}>
                        ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>{t('Payment Type')}</Text>
                <Text style={styles.modalValue}>
                  {selectedPaymentType
                    ? t(selectedPaymentType.paymentType || selectedPaymentType.name || '') ||
                      selectedPaymentType.paymentType ||
                      selectedPaymentType.name ||
                      '-'
                    : '-'}
                </Text>
              </View>
              {!!remarks && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{t('Remarks')}</Text>
                  <Text style={styles.modalValue}>{remarks}</Text>
                </View>
              )}
              {!!refId && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{t('Reference ID')}</Text>
                  <Text style={styles.modalValue}>{refId}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleFinalSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>{t('Submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* Reusable Custom Dropdown Component */
export interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  placeholder: string;
  options: (string | DropdownOption)[];
  onSelect?: (value: string) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  error?: string;
  disabled?: boolean;
  modalTitle: string;
  multiSelect?: boolean;
  selectedValues?: string[];
  onMultiSelectChange?: (values: string[]) => void;
  doneButtonText?: string;
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
  multiSelect = false,
  selectedValues = [],
  onMultiSelectChange,
  doneButtonText = 'Done',
}: CustomDropdownProps) {
  const normalizedOptions: DropdownOption[] = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option
  );

  const handleToggle = (optVal: string) => {
    const isSelected = selectedValues.includes(optVal);
    const next = isSelected
      ? selectedValues.filter((v) => v !== optVal)
      : [...selectedValues, optVal];
    onMultiSelectChange?.(next);
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
        <Text
          style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}
          numberOfLines={2}
        >
          {value || placeholder}
        </Text>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={disabled ? '#BAC4D0' : '#697788'}
        />
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
              <TouchableOpacity
                onPress={() => setVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color="#173B63" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.dropdownOptionsList}
              showsVerticalScrollIndicator={false}
            >
              {normalizedOptions.map((option) => {
                const isSelected = multiSelect
                  ? selectedValues.includes(option.value)
                  : value === option.label || value === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      if (multiSelect) {
                        handleToggle(option.value);
                      } else {
                        onSelect?.(option.value);
                        setVisible(false);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {multiSelect ? (
                      <View style={styles.dropdownCheckboxRow}>
                        <MaterialIcons
                          name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                          size={22}
                          color={isSelected ? '#0B5CAD' : '#8B96A5'}
                        />
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            isSelected && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            isSelected && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <MaterialIcons name="check" size={20} color="#0B5CAD" />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {multiSelect && (
              <View style={styles.dropdownModalFooter}>
                <TouchableOpacity
                  style={styles.dropdownDoneBtn}
                  onPress={() => setVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownDoneBtnText}>{doneButtonText}</Text>
                </TouchableOpacity>
              </View>
            )}
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
  },
  headerTitle: {
    color: '#173B63',
    fontSize: 20,
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
  formSectionTitle: {
    color: '#173B63',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSectionSubtitle: {
    color: '#697788',
    fontSize: 13,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  formGroup: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    color: '#354052',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 52,
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#173B63',
  },
  inputFocused: {
    borderColor: '#0B5CAD',
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  textArea: {
    height: 100,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  counterText: {
    color: '#7B8794',
    fontSize: 12,
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
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  /* Dropdown Trigger Styling */
  dropdownContainer: {
    marginBottom: 16,
    width: '100%',
  },
  dropdownTrigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    flex: 1,
    fontSize: 14,
    color: '#173B63',
    marginRight: 8,
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
  dropdownCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownModalFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4EBF2',
  },
  dropdownDoneBtn: {
    backgroundColor: '#0B5CAD',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  /* Toast styles */
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
  /* Confirmation Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 30, 66, 0.54)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 380,
    padding: 24,
    elevation: 10,
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#173B63',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#697788',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalDetails: {
    backgroundColor: '#F4F7FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  modalRow: {
    flexDirection: 'column',
    gap: 2,
  },
  modalLabel: {
    fontSize: 11,
    color: '#7B8794',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalValue: {
    fontSize: 14,
    color: '#173B63',
  },
  modalAmount: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
  },
  modalSubtypeAmountList: {
    width: '100%',
    gap: 4,
    marginTop: 4,
  },
  modalSubtypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  modalSubtypeLabel: {
    fontSize: 13,
    color: '#354052',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  modalSubtypeAmount: {
    fontSize: 14,
    color: '#173B63',
    fontWeight: '600',
  },
  modalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#D8E2EC',
    paddingTop: 8,
    marginTop: 4,
  },
  modalTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#173B63',
  },
  modalTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    color: '#697788',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
