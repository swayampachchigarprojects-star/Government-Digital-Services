import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { fetchTransactionsByDate, ServicesTransaction } from '../services/transactionService';

interface ServicesScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToScreen: (screen: 'income' | 'expense') => void;
}

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function ServicesScreen({ onBack, onLogout, onNavigateToScreen }: ServicesScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [dateError, setDateError] = useState<string>('');
  const [transactions, setTransactions] = useState<ServicesTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  const { language, setLanguage, t } = useLanguage();

  const handleGetTransactions = async () => {
    if (!selectedDate) {
      setDateError(t('Date is required'));
      return;
    }
    setDateError('');
    setLoadingTransactions(true);
    setTransactionsError(null);
    setHasFetched(true);

    try {
      const results = await fetchTransactionsByDate(selectedDate);
      setTransactions(results);
    } catch (err: any) {
      console.error('Failed to fetch transactions by date:', err);
      setTransactions([]);
      setTransactionsError(err?.message || t('Unable to fetch transactions. Please try again.'));
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCardPress = (serviceName: string, id: string) => {
    if (id === 'income' || id === 'expense') {
      onNavigateToScreen(id);
    } else {
      Alert.alert(
        t('Service Selected'),
        t('You have opened the service module.', { serviceName })
      );
    }
  };

  const handleLogoutPress = () => {
    setShowMenu(false);
    Alert.alert(
      t('Sign Out'),
      t('Are you sure you want to sign out from the portal?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Sign Out'), style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const handleMyProfilePress = () => {
    setShowMenu(false);
    setShowProfile(true);
  };

  const services = [
    {
      id: 'income',
      title: t('Income'),
      // description: t('Record incoming revenue, agricultural yields, and other income sources securely.'),
      icon: 'account-balance-wallet' as const,
      color: '#10B981', // green
      bgTint: '#E6F8F3',
    },
    {
      id: 'expense',
      title: t('Expense'),
      // description: t('Log administrative expenditures, purchases, and operational costs.'),
      icon: 'payment' as const,
      color: '#EF4444', // crimson/red
      bgTint: '#FDF2F2',
    },
    // {
    //   id: 'report',
    //   title: t('Report'),
    //   description: t('Generate financial reports, view visual analytics, and export summaries.'),
    //   icon: 'assessment' as const,
    //   color: '#0B5CAD', // royal blue
    //   bgTint: '#EEF6FC',
    // },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.logoAndTitle}>
                {/* <TouchableOpacity
                  style={styles.backButtonHeader}
                  onPress={onBack}
                  activeOpacity={0.6}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#173B63" />
                </TouchableOpacity> */}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>GS</Text>
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.headerTitle}>{t('Lekha')}</Text>
                  <Text style={styles.headerSubtitle}>{t('Accounting Services')}</Text>
                </View>
              </View>
            </View>
          </View>

          {showProfile ? (
            /* Profile View */
            <View style={styles.profileView}>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowProfile(false)}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#173B63" />
                  <Text style={styles.backButtonText}>{t('Back to Services')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileCard}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileAvatarLargeText}>TA</Text>
                </View>
                <Text style={styles.profileName}>Nimesh Patel</Text>
                <Text style={styles.profileRole}>{t('Village Officer (Talati)')}</Text>

                <View style={styles.profileDivider} />

                <View style={styles.detailRow}>
                  <MaterialIcons name="email" size={20} color="#697788" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>{t('Email Address')}</Text>
                    <Text style={styles.detailValue}>citizen.admin@gov.in</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="business" size={20} color="#697788" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>{t('Department')}</Text>
                    <Text style={styles.detailValue}>{t('Revenue & Land Records')}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="badge" size={20} color="#697788" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>{t('Employee ID')}</Text>
                    <Text style={styles.detailValue}>EMP-2026-8849</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="verified" size={20} color="#10B981" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>{t('Status')}</Text>
                    <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '700' }]}>{t('Active / On Duty')}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.backToServicesBtn}
                  onPress={() => setShowProfile(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backToServicesBtnText}>{t('Back to Services')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Services Grid View */
            <View>
              {/* Services Cards List */}
              <View style={styles.cardsContainer}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.card}
                    onPress={() => handleCardPress(service.title, service.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: service.bgTint }]}>
                      <MaterialIcons name={service.icon} size={26} color={service.color} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{service.title}</Text>
                    </View>
                    <View style={styles.chevronContainer}>
                      <MaterialIcons name="chevron-right" size={24} color={service.color} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Transactions Section */}
              <View style={styles.transactionsSection}>
                <View style={styles.transactionsHeaderRow}>
                  <MaterialIcons name="receipt-long" size={22} color="#0B5CAD" />
                  <Text style={styles.transactionsLabel}>{t('Transactions')}</Text>
                </View>
                <Text style={styles.transactionsSubLabel}>
                  {t('View transactions recorded on a specific date')}
                </Text>

                {/* Date Picker */}
                <View style={styles.datePickerContainer}>
                  <CustomDatePicker
                    label={t('Date')}
                    value={selectedDate}
                    placeholder={t('Select Date')}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDateError('');
                    }}
                    error={dateError}
                    modalTitle={t('Select Date Modal Title')}
                    maxDate={new Date()}
                  />
                </View>

                {/* Get Transactions Button */}
                <TouchableOpacity
                  style={[
                    styles.getTransactionsButton,
                    loadingTransactions && styles.getTransactionsButtonDisabled,
                  ]}
                  onPress={handleGetTransactions}
                  disabled={loadingTransactions}
                  activeOpacity={0.85}
                >
                  {loadingTransactions ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="search" size={20} color="#FFFFFF" />
                      <Text style={styles.getTransactionsButtonText}>
                        {t('Get Transactions')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Status & Results */}
                {loadingTransactions && (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#0B5CAD" />
                    <Text style={styles.loadingText}>{t('Loading')}</Text>
                  </View>
                )}

                {!loadingTransactions && !!transactionsError && (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="error-outline" size={28} color="#EF4444" />
                    <Text style={styles.errorTextHeading}>{t('Error')}</Text>
                    <Text style={styles.errorTextDescription}>{transactionsError}</Text>
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={handleGetTransactions}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.retryBtnText}>{t('Retry')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!loadingTransactions && !transactionsError && hasFetched && transactions.length === 0 && (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="search-off" size={36} color="#BAC4D0" />
                    <Text style={styles.emptyTitle}>{t('No transactions found')}</Text>
                    <Text style={styles.emptySubtitle}>
                      {t('No transactions found for this date')}
                    </Text>
                  </View>
                )}

                {!loadingTransactions && !transactionsError && hasFetched && transactions.length > 0 && (
                  <View style={styles.gridCard}>
                    {/* Grid Header */}
                    <View style={styles.gridHeaderRow}>
                      <View style={styles.colType}>
                        <Text style={styles.gridHeaderCell}>{t('Transaction Type')}</Text>
                      </View>
                      <View style={styles.colHead}>
                        <Text style={styles.gridHeaderCell}>{t('Transaction Head')}</Text>
                      </View>
                      <View style={styles.colAmount}>
                        <Text style={[styles.gridHeaderCell, { textAlign: 'right' }]}>
                          {t('Amount')}
                        </Text>
                      </View>
                    </View>

                    {/* Grid Rows */}
                    {transactions.map((txn, index) => {
                      const isIncome = txn.transactionType === 'INCOME';
                      const rawHead = txn.transactionHead || txn.transactionHeadName || txn.transactionHeadCode || '-';
                      const displayHead = t(rawHead) || rawHead;
                      const formattedAmount = Number(txn.amount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });

                      return (
                        <View
                          key={txn.id || `txn-${index}`}
                          style={[
                            styles.gridRow,
                            index % 2 === 1 && styles.gridRowAlternating,
                            index === transactions.length - 1 && styles.gridRowLast,
                          ]}
                        >
                          <View style={styles.colType}>
                            <View
                              style={[
                                styles.typePill,
                                isIncome ? styles.typePillIncome : styles.typePillExpense,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.typePillText,
                                  isIncome ? styles.typePillTextIncome : styles.typePillTextExpense,
                                ]}
                                numberOfLines={1}
                              >
                                {t(txn.transactionType) || txn.transactionType}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.colHead}>
                            <Text style={styles.headText} numberOfLines={2}>
                              {displayHead}
                            </Text>
                          </View>

                          <View style={styles.colAmount}>
                            <Text
                              style={[
                                styles.amountText,
                                isIncome ? { color: '#10B981' } : { color: '#EF4444' },
                              ]}
                              numberOfLines={1}
                            >
                              ₹ {formattedAmount}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {showLanguageMenu && (
          <TouchableOpacity
            style={styles.languageMenuBackdrop}
            activeOpacity={1}
            onPress={() => setShowLanguageMenu(false)}
          >
            <View style={styles.languageDropdown}>
              <Text style={styles.languageMenuTitle}>
                {t('Language')}
              </Text>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.languageItem}
                onPress={() => {
                  setLanguage('gu');
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={styles.languageItemText}>
                  ગુજરાતી
                </Text>

                {language === 'gu' && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color="#0B5CAD"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageItem}
                onPress={() => {
                  setLanguage('en');
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={styles.languageItemText}>
                  English
                </Text>

                {language === 'en' && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color="#0B5CAD"
                  />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Profile Menu Popover overlay */}
      {showMenu && (
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={handleMyProfilePress}>
              <MaterialIcons name="person" size={20} color="#173B63" />
              <Text style={styles.menuItemText}>{t('My Profile')}</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={[styles.menuItem, styles.menuItemLogout]} onPress={handleLogoutPress}>
              <MaterialIcons name="logout" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.menuItemTextLogout]}>{t('Logout')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FA',
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
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  languageButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF6FC',
  },
  backButtonHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF6FC',
    marginRight: 10,
  },

  languageMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1100,
  },

  languageDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 76 : 64,
    right: 64,
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 8,
    width: 160,
    elevation: 8,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    paddingVertical: 4,
    zIndex: 1101,
  },

  languageMenuTitle: {
    fontSize: 13,
    color: '#697788',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  languageItemText: {
    fontSize: 14,
    color: '#173B63',
    fontWeight: '600',
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0B5CAD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginRight: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  titleContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  headerTitle: {
    color: '#173B63',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#667585',
    fontSize: 12,
    marginTop: 2,
  },
  profileAvatarButton: {
    padding: 2,
    borderRadius: 20,
  },
  sectionTitle: {
    color: '#173B63',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#697788',
    fontSize: 13,
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#173B63',
    fontSize: 16,
    fontWeight: '700',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDescription: {
    color: '#697788',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#7A8795',
  },
  craftedText: {
    fontSize: 11,
    color: '#9AA5B1',
  },
  /* Profile View Styles */
  profileView: {
    width: '100%',
  },
  profileHeader: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#173B63',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  profileAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#D0E2F5',
  },
  profileAvatarLargeText: {
    color: '#0B5CAD',
    fontSize: 28,
    fontWeight: '700',
  },
  profileName: {
    color: '#173B63',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileRole: {
    color: '#697788',
    fontSize: 14,
    marginBottom: 20,
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4EBF2',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    gap: 16,
    paddingHorizontal: 8,
  },
  detailTextContainer: {
    flexDirection: 'column',
  },
  detailLabel: {
    fontSize: 11,
    color: '#7B8794',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#173B63',
    fontWeight: '500',
  },
  backToServicesBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#0B5CAD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  backToServicesBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  /* Popover Menu Styles */
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 76 : 64, // adjusted below header row
    right: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 8,
    width: 150,
    elevation: 8,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    paddingVertical: 4,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#173B63',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E4EBF2',
  },
  menuItemLogout: {
    backgroundColor: '#FFF5F5',
  },
  menuItemTextLogout: {
    color: '#EF4444',
  },
  /* Transactions Section Styles */
  separator: {
    height: 1,
    backgroundColor: '#D8E2EC',
    marginVertical: 24,
    width: '100%',
  },
  transactionsSection: {
    width: '100%',
  },
  transactionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  transactionsLabel: {
    color: '#173B63',
    fontSize: 18,
    fontWeight: '700',
  },
  transactionsSubLabel: {
    color: '#697788',
    fontSize: 13,
    marginBottom: 16,
  },
  datePickerContainer: {
    marginBottom: 14,
  },
  getTransactionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B5CAD',
    borderRadius: 8,
    height: 48,
    gap: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  getTransactionsButtonDisabled: {
    opacity: 0.7,
  },
  getTransactionsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#697788',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  errorTextHeading: {
    color: '#C53030',
    fontSize: 15,
    fontWeight: '700',
  },
  errorTextDescription: {
    color: '#E53E3E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#173B63',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#8B96A5',
    fontSize: 13,
    textAlign: 'center',
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F7FA',
    borderBottomWidth: 1,
    borderBottomColor: '#D8E2EC',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  gridHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#697788',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF2',
  },
  gridRowAlternating: {
    backgroundColor: '#FAFBFD',
  },
  gridRowLast: {
    borderBottomWidth: 0,
  },
  colType: {
    width: '30%',
    paddingRight: 6,
  },
  colHead: {
    width: '42%',
    paddingRight: 6,
  },
  colAmount: {
    width: '28%',
    alignItems: 'flex-end',
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typePillIncome: {
    backgroundColor: '#E6F8F3',
  },
  typePillExpense: {
    backgroundColor: '#FDF2F2',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typePillTextIncome: {
    color: '#10B981',
  },
  typePillTextExpense: {
    color: '#EF4444',
  },
  headText: {
    fontSize: 13,
    color: '#173B63',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#173B63',
    textAlign: 'right',
  },
});
