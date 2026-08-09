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

interface ExpenseEntryScreenProps {
  onBack: () => void;
}

// Custom dropdown data mapping for Expenses
const expenseData: Record<string, string[]> = {
  'Infrastructure & Development': ['Road Construction', 'Street Lighting', 'Water Supply Maintenance', 'Sanitation Works'],
  'Administrative Expenses': ['Office Supplies', 'Staff Salaries', 'Utility Bills', 'Printing & Stationery'],
  'Social Welfare & Schemes': ['Pension Disbursal', 'Scholarships', 'Healthcare Camps', 'Agricultural Subsidies'],
  'Miscellaneous Expenses': ['Event Organization', 'Emergency Relief', 'Equipment Purchase', 'Repairs & Maintenance'],
};

export function ExpenseEntryScreen({ onBack }: ExpenseEntryScreenProps) {
  // Input fields
  const [expenseType, setExpenseType] = useState('');
  const [expenseSubtype, setExpenseSubtype] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [refId, setRefId] = useState('');

  // Dropdown visibility
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [subtypeDropdownVisible, setSubtypeDropdownVisible] = useState(false);

  // Focus states
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isRemarksFocused, setIsRemarksFocused] = useState(false);
  const [isRefIdFocused, setIsRefIdFocused] = useState(false);

  // Errors
  const [typeError, setTypeError] = useState('');
  const [subtypeError, setSubtypeError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Modal and Toast States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Update subtypes when type changes
  useEffect(() => {
    setExpenseSubtype('');
    setSubtypeError('');
  }, [expenseType]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const handleAmountChange = (text: string) => {
    // Only allow positive numbers with up to 2 decimal points
    if (text === '' || /^\d+\.?\d{0,2}$/.test(text)) {
      setAmount(text);
      if (amountError) setAmountError('');
    }
  };

  const validateForm = () => {
    let isValid = true;
    if (!expenseType) {
      setTypeError('Expense Type is required');
      isValid = false;
    } else {
      setTypeError('');
    }

    if (!expenseSubtype) {
      setSubtypeError('Expense Subtype is required');
      isValid = false;
    } else {
      setSubtypeError('');
    }

    const amtVal = parseFloat(amount);
    if (!amount) {
      setAmountError('Amount is required');
      isValid = false;
    } else if (isNaN(amtVal) || amtVal <= 0) {
      setAmountError('Amount must be a positive number greater than 0');
      isValid = false;
    } else {
      setAmountError('');
    }

    return isValid;
  };

  const handleSubmitPress = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalSubmit = () => {
    setShowConfirmModal(false);
    
    // Clear form inputs
    setExpenseType('');
    setExpenseSubtype('');
    setAmount('');
    setRemarks('');
    setRefId('');
    
    // Trigger Success Toast
    triggerToast('Success! Expense entry has been recorded successfully.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Toast Alert */}
      {toastVisible && (
        <View style={styles.toastContainer}>
          <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.6}>
          <MaterialIcons name="arrow-back" size={24} color="#173B63" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Expense Entry</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* Form */}
          <View style={styles.formCard}>
            
            {/* Expense Type Dropdown */}
            <CustomDropdown
              label="Expense Type"
              value={expenseType}
              placeholder="Select Expense Type"
              options={Object.keys(expenseData)}
              onSelect={(val) => {
                setExpenseType(val);
                setTypeError('');
              }}
              visible={typeDropdownVisible}
              setVisible={setTypeDropdownVisible}
              error={typeError}
            />

            {/* Expense Subtype Dropdown */}
            <CustomDropdown
              label="Expense Subtype"
              value={expenseSubtype}
              placeholder={expenseType ? "Select Subtype" : "First select Expense Type"}
              options={expenseType ? expenseData[expenseType] : []}
              onSelect={(val) => {
                setExpenseSubtype(val);
                setSubtypeError('');
              }}
              visible={subtypeDropdownVisible}
              setVisible={setSubtypeDropdownVisible}
              error={subtypeError}
              disabled={!expenseType}
            />

            {/* Amount Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                style={[
                  styles.input,
                  isAmountFocused && styles.inputFocused,
                  !!amountError && styles.inputError,
                ]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="Enter amount (e.g. 1200.00)"
                placeholderTextColor="#8B96A5"
                keyboardType="decimal-pad"
                onFocus={() => setIsAmountFocused(true)}
                onBlur={() => setIsAmountFocused(false)}
              />
              {!!amountError && <Text style={styles.errorText}>{amountError}</Text>}
            </View>

            {/* Remarks Text Area */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Remarks (Optional)</Text>
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
                placeholder="Add contextual notes or remarks..."
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
                <Text style={styles.label}>Reference ID (Optional)</Text>
                <Text style={styles.counterText}>{refId.length} / 100</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  isRefIdFocused && styles.inputFocused,
                ]}
                value={refId}
                onChangeText={(text) => setRefId(text.substring(0, 100))}
                placeholder="e.g. EXP-10824982"
                placeholderTextColor="#8B96A5"
                maxLength={100}
                autoCapitalize="characters"
                onFocus={() => setIsRefIdFocused(true)}
                onBlur={() => setIsRefIdFocused(false)}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#EF4444' }]} // Crimson for expenses
              onPress={handleSubmitPress}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Submit Entry</Text>
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
            <Text style={styles.modalTitle}>Confirm Expense Entry</Text>
            <Text style={styles.modalSubtitle}>Please verify the transaction details below before committing to database.</Text>

            <View style={styles.modalDetails}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Expense Type</Text>
                <Text style={styles.modalValue}>{expenseType}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Expense Subtype</Text>
                <Text style={styles.modalValue}>{expenseSubtype}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Amount</Text>
                <Text style={[styles.modalAmount, { color: '#EF4444' }]}>₹ {parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
              {!!remarks && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Remarks</Text>
                  <Text style={styles.modalValue}>{remarks}</Text>
                </View>
              )}
              {!!refId && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Reference ID</Text>
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
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]} // Crimson for expenses
                onPress={handleFinalSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* Reusable Custom Dropdown Component */
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
        <MaterialIcons name="arrow-drop-down" size={24} color={disabled ? "#BAC4D0" : "#697788"} />
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
              <Text style={styles.dropdownModalTitle}>Select {label}</Text>
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
  headerSubtitle: {
    color: '#667585',
    fontSize: 11,
    marginTop: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
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
  /* Toast styles */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    right: 20,
    backgroundColor: '#10B981', // green for success
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
    fontWeight: '700',
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
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
