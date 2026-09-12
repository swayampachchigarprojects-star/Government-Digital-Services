import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/apiClient';
import {
  createAccountingEntity,
  extractEntityId,
  PaymentTypeEntry,
  CreateEntityPayload,
} from '../services/entityService';

const GUJARAT_DISTRICTS = [
  'Ahmedabad',
  'Amreli',
  'Anand',
  'Aravalli',
  'Banaskantha',
  'Bharuch',
  'Bhavnagar',
  'Botad',
  'Chhota Udaipur',
  'Dahod',
  'Dang',
  'Devbhoomi Dwarka',
  'Gandhinagar',
  'Gir Somnath',
  'Jamnagar',
  'Junagadh',
  'Kheda',
  'Kutch',
  'Mahisagar',
  'Mehsana',
  'Morbi',
  'Narmada',
  'Navsari',
  'Panchmahal',
  'Patan',
  'Porbandar',
  'Rajkot',
  'Sabarkantha',
  'Surat',
  'Surendranagar',
  'Tapi',
  'Vadodara',
  'Valsad',
];

const SUGGESTED_PAYMENT_TYPES = ['Cash', 'Bank'];

export interface CreateEntityProps {
  onCancel: () => void;
  onCreateSuccess?: () => void;
}

export function CreateEntity({ onCancel, onCreateSuccess }: CreateEntityProps) {
  const { language, setLanguage, t } = useLanguage();
  const { setEntityId } = useAuth();

  // Form Fields State
  const [entityName, setEntityName] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');

  // Payment Types State (at least 1 entry by default)
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeEntry[]>([
    { id: '1', name: 'Cash', openingBalance: '0' },
  ]);

  // UI / Modal States
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field Focus States
  const [isEntityFocused, setIsEntityFocused] = useState(false);
  const [isTalukaFocused, setIsTalukaFocused] = useState(false);
  const [isVillageFocused, setIsVillageFocused] = useState(false);

  // Validation Error States
  const [errors, setErrors] = useState<{
    entityName?: string;
    district?: string;
    taluka?: string;
    village?: string;
    paymentTypes?: string;
  }>({});

  // Add new Payment Type Entry
  const handleAddPaymentType = () => {
    const nextId = String(Date.now() + Math.random());
    setPaymentTypes((prev) => [
      ...prev,
      { id: nextId, name: '', openingBalance: '' },
    ]);
    setErrors((prev) => ({ ...prev, paymentTypes: undefined }));
  };

  // Remove Payment Type Entry
  const handleRemovePaymentType = (id: string) => {
    if (paymentTypes.length <= 1) {
      Alert.alert(t('Validation Error'), t('At least one payment type is required'));
      return;
    }
    setPaymentTypes((prev) => prev.filter((item) => item.id !== id));
  };

  // Update Payment Type Name
  const handleUpdatePaymentTypeName = (id: string, name: string) => {
    setPaymentTypes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
    setErrors((prev) => ({ ...prev, paymentTypes: undefined }));
  };

  // Update Payment Type Opening Balance
  const handleUpdatePaymentTypeBalance = (id: string, openingBalance: string) => {
    // Only allow numbers and decimal point
    const sanitized = openingBalance.replace(/[^0-9.]/g, '');
    setPaymentTypes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, openingBalance: sanitized } : item))
    );
    setErrors((prev) => ({ ...prev, paymentTypes: undefined }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!entityName.trim()) {
      newErrors.entityName = t('Entity Name is required');
    }
    if (!district.trim()) {
      newErrors.district = t('District is required');
    }
    if (!taluka.trim()) {
      newErrors.taluka = t('Taluka is required');
    }
    if (!village.trim()) {
      newErrors.village = t('Village is required');
    }

    if (paymentTypes.length === 0) {
      newErrors.paymentTypes = t('At least one payment type is required');
    } else {
      const hasInvalidName = paymentTypes.some((item) => !item.name.trim());
      const hasInvalidBalance = paymentTypes.some(
        (item) => item.openingBalance.trim() === '' || isNaN(Number(item.openingBalance)) || Number(item.openingBalance) < 0
      );

      if (hasInvalidName) {
        newErrors.paymentTypes = t('Payment type name is required');
      } else if (hasInvalidBalance) {
        newErrors.paymentTypes = t('Please enter a valid opening balance');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Create Entity Submission
  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateEntityPayload = {
        accountingEntityName: entityName.trim(),
        accountingEntityType: 'VILLAGE',
        district: district.trim(),
        taluka: taluka.trim(),
        village: village.trim(),
        paymentTypes: paymentTypes.map((pt) => ({
          paymentType: pt.name.trim(),
          balance: Number(pt.openingBalance) || 0,
        })),
      };

      const result = await createAccountingEntity(payload);
      const createdEntityId = extractEntityId(result);
      if (createdEntityId) {
        await setEntityId(createdEntityId);
      }

      // Success -> navigate to Dashboard
      onCreateSuccess?.();
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 400
          ? t('The request could not be completed.')
          : error instanceof ApiError && error.status === 0
            ? t('Unable to connect to the server. Please try again.')
            : error instanceof Error
              ? error.message
              : t('The request could not be completed.');
      Alert.alert(t('Error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Action
  const handleCancelPress = () => {
    Alert.alert(
      t('Cancel Registration'),
      t('Are you sure you want to cancel entity registration?'),
      [
        { text: t('Stay'), style: 'cancel' },
        {
          text: t('Cancel'),
          style: 'destructive',
          onPress: onCancel,
        },
      ]
    );
  };

  // Filtered districts for search
  const filteredDistricts = GUJARAT_DISTRICTS.filter((d) => {
    const localized = t(d).toLowerCase();
    const english = d.toLowerCase();
    const query = districtSearch.toLowerCase().trim();
    return localized.includes(query) || english.includes(query);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.badge}>
              <MaterialIcons name="domain" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>{t('Create Entity')}</Text>
              <Text style={styles.headerSubtitle}>
                {t('Register your accounting entity to get started')}
              </Text>
            </View>
          </View>

          {/* Language Switcher */}
          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[
                styles.languageBtn,
                language === 'gu' && styles.languageBtnActive,
              ]}
              onPress={() => setLanguage('gu')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageBtnText,
                  language === 'gu' && styles.languageBtnTextActive,
                ]}
              >
                ગુજરાતી
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageBtn,
                language === 'en' && styles.languageBtnActive,
              ]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageBtnText,
                  language === 'en' && styles.languageBtnTextActive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Entity Information Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialIcons name="business" size={20} color="#0B5CAD" />
                <Text style={styles.cardTitle}>{t('Entity Details')}</Text>
              </View>

              {/* Entity Name Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {t('Entity Name')} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    isEntityFocused && styles.inputFocused,
                    !!errors.entityName && styles.inputError,
                  ]}
                  value={entityName}
                  onChangeText={(val) => {
                    setEntityName(val);
                    if (errors.entityName) setErrors((e) => ({ ...e, entityName: undefined }));
                  }}
                  onFocus={() => setIsEntityFocused(true)}
                  onBlur={() => setIsEntityFocused(false)}
                  placeholder={t('Enter Entity Name')}
                  placeholderTextColor="#9AA5B1"
                />
                {!!errors.entityName && (
                  <Text style={styles.fieldErrorText}>{errors.entityName}</Text>
                )}
              </View>
            </View>

            {/* Location Details Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialIcons name="location-on" size={20} color="#0B5CAD" />
                <Text style={styles.cardTitle}>{t('Location Details')}</Text>
              </View>

              {/* Jilla (District) Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {t('Jilla')} / {t('District')}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    districtModalVisible && styles.dropdownTriggerActive,
                    !!errors.district && styles.inputError,
                  ]}
                  onPress={() => setDistrictModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownValue,
                      !district && styles.dropdownPlaceholder,
                    ]}
                  >
                    {district ? t(district) : t('Select District')}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color="#697788" />
                </TouchableOpacity>
                {!!errors.district && (
                  <Text style={styles.fieldErrorText}>{errors.district}</Text>
                )}
              </View>

              {/* Taluka Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {t('Taluka')} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    isTalukaFocused && styles.inputFocused,
                    !!errors.taluka && styles.inputError,
                  ]}
                  value={taluka}
                  onChangeText={(val) => {
                    setTaluka(val);
                    if (errors.taluka) setErrors((e) => ({ ...e, taluka: undefined }));
                  }}
                  onFocus={() => setIsTalukaFocused(true)}
                  onBlur={() => setIsTalukaFocused(false)}
                  placeholder={t('Enter Taluka')}
                  placeholderTextColor="#9AA5B1"
                />
                {!!errors.taluka && (
                  <Text style={styles.fieldErrorText}>{errors.taluka}</Text>
                )}
              </View>

              {/* Village Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  {t('Village')} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    isVillageFocused && styles.inputFocused,
                    !!errors.village && styles.inputError,
                  ]}
                  value={village}
                  onChangeText={(val) => {
                    setVillage(val);
                    if (errors.village) setErrors((e) => ({ ...e, village: undefined }));
                  }}
                  onFocus={() => setIsVillageFocused(true)}
                  onBlur={() => setIsVillageFocused(false)}
                  placeholder={t('Enter Village')}
                  placeholderTextColor="#9AA5B1"
                />
                {!!errors.village && (
                  <Text style={styles.fieldErrorText}>{errors.village}</Text>
                )}
              </View>
            </View>

            {/* Payment Type Dynamic Section */}
            <View style={styles.card}>
              <View style={styles.paymentTypeHeaderRow}>
                <View style={styles.paymentTypeLabelGroup}>
                  <MaterialIcons name="account-balance-wallet" size={20} color="#0B5CAD" />
                  <Text style={styles.cardTitle}>
                    {t('Payment Type')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                </View>

                {/* Plus (+) Button beside Payment Type Label */}
                <TouchableOpacity
                  style={styles.addPaymentTypeButton}
                  onPress={handleAddPaymentType}
                  activeOpacity={0.7}
                  accessibilityLabel={t('Add Payment Type')}
                >
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addPaymentTypeButtonText}>
                    {t('Add Payment Type')}
                  </Text>
                </TouchableOpacity>
              </View>

              {!!errors.paymentTypes && (
                <View style={styles.bannerError}>
                  <MaterialIcons name="error-outline" size={16} color="#C53030" />
                  <Text style={styles.bannerErrorText}>{errors.paymentTypes}</Text>
                </View>
              )}

              {/* Payment Type Entries List */}
              {paymentTypes.map((entry, index) => (
                <View key={entry.id} style={styles.paymentTypeCard}>
                  <View style={styles.paymentTypeCardHeader}>
                    <View style={styles.entryTag}>
                      <Text style={styles.entryTagText}>#{index + 1}</Text>
                    </View>

                    {paymentTypes.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeEntryBtn}
                        onPress={() => handleRemovePaymentType(entry.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="delete-outline" size={20} color="#E53E3E" />
                        <Text style={styles.removeEntryText}>{t('Remove')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Payment Type Name Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.subLabel}>
                      {t('Payment Type Name')} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={entry.name}
                      onChangeText={(val) => handleUpdatePaymentTypeName(entry.id, val)}
                      placeholder={t('Enter Payment Type Name')}
                      placeholderTextColor="#9AA5B1"
                    />

                    {/* Quick suggestion chips for payment types */}
                    <View style={styles.chipRow}>
                      {/* {SUGGESTED_PAYMENT_TYPES.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion}
                          style={[
                            styles.chip,
                            entry.name.toLowerCase() === suggestion.toLowerCase() &&
                              styles.chipActive,
                          ]}
                          onPress={() =>
                            handleUpdatePaymentTypeName(entry.id, suggestion)
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              entry.name.toLowerCase() === suggestion.toLowerCase() &&
                                styles.chipTextActive,
                            ]}
                          >
                            {t(suggestion)}
                          </Text>
                        </TouchableOpacity>
                      ))} */}
                    </View>
                  </View>

                  {/* Opening Balance Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.subLabel}>
                      {t('Opening Balance')} (₹){' '}
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={entry.openingBalance}
                      onChangeText={(val) =>
                        handleUpdatePaymentTypeBalance(entry.id, val)
                      }
                      placeholder={t('Enter Opening Balance')}
                      placeholderTextColor="#9AA5B1"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Action Buttons: Create and Cancel */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelPress}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  isSubmitting && styles.createButtonDisabled,
                ]}
                onPress={() => { void handleCreate(); }}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>{t('Create')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* District Selection Modal */}
        <Modal
          visible={districtModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDistrictModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDistrictModalVisible(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('Select District')}
                </Text>
                <TouchableOpacity
                  onPress={() => setDistrictModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={24} color="#173B63" />
                </TouchableOpacity>
              </View>

              {/* Search Bar for District Modal */}
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#8B96A5" />
                <TextInput
                  style={styles.searchInput}
                  value={districtSearch}
                  onChangeText={setDistrictSearch}
                  placeholder={t('Search...')}
                  placeholderTextColor="#8B96A5"
                  autoFocus={false}
                />
                {districtSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setDistrictSearch('')}>
                    <MaterialIcons name="cancel" size={18} color="#8B96A5" />
                  </TouchableOpacity>
                )}
              </View>

              {/* District List */}
              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
              >
                {filteredDistricts.map((item) => {
                  const isSelected = district === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      onPress={() => {
                        setDistrict(item);
                        setErrors((e) => ({ ...e, district: undefined }));
                        setDistrictModalVisible(false);
                        setDistrictSearch('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionItemText,
                          isSelected && styles.optionItemTextSelected,
                        ]}
                      >
                        {t(item)}
                      </Text>
                      {isSelected && (
                        <MaterialIcons name="check" size={20} color="#0B5CAD" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B5CAD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#173B63',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#697788',
    marginTop: 2,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    padding: 2,
    marginLeft: 8,
  },
  languageBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  languageBtnActive: {
    backgroundColor: '#0B5CAD',
  },
  languageBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#697788',
  },
  languageBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 540,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#173B63',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#354052',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#E53E3E',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    borderRadius: 8,
    paddingHorizontal: 14,
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
  fieldErrorText: {
    color: '#E53E3E',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  dropdownTrigger: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerActive: {
    borderColor: '#0B5CAD',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#173B63',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#9AA5B1',
    fontWeight: '400',
  },
  paymentTypeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  paymentTypeLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPaymentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B5CAD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addPaymentTypeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  bannerErrorText: {
    color: '#C53030',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  paymentTypeCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E9F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  paymentTypeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  entryTag: {
    backgroundColor: '#EEF6FC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  entryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B5CAD',
  },
  removeEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeEntryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E53E3E',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#EEF6FC',
    borderColor: '#0B5CAD',
  },
  chipText: {
    fontSize: 12,
    color: '#697788',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#0B5CAD',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#697788',
  },
  createButton: {
    flex: 1.5,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#0B5CAD',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 30, 66, 0.54)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173B63',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FA',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#173B63',
  },
  optionsList: {
    paddingHorizontal: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  optionItemSelected: {
    backgroundColor: '#EEF6FC',
  },
  optionItemText: {
    fontSize: 14,
    color: '#173B63',
  },
  optionItemTextSelected: {
    color: '#0B5CAD',
    fontWeight: '700',
  },
});
