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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { fetchBalances, BalanceItem } from '../services/dashboardService';

interface DashboardScreenProps {
  onLogout: () => void;
  onNavigateToServices: () => void;
  onNavigateToProfile?: () => void;
}

interface CardTheme {
  borderColor?: string;
  iconBg: string;
  iconColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  valueColor: string;
}

const CARD_THEMES: CardTheme[] = [
  {
    //borderColor: '#10B981', // Emerald
    iconBg: '#E6F8F3',
    iconColor: '#10B981',
    icon: 'account-balance-wallet',
    valueColor: '#0E835C',
  },
  {
    //borderColor: '#0B5CAD', // Government Blue
    iconBg: '#EEF6FC',
    iconColor: '#0B5CAD',
    icon: 'account-balance',
    valueColor: '#0B5CAD',
  },
  {
    //borderColor: '#F59E0B', // Amber
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    icon: 'savings',
    valueColor: '#B45309',
  },
  {
    borderColor: '#8B5CF6', // Violet
    iconBg: '#F3E8FF',
    iconColor: '#7C3AED',
    icon: 'payments',
    valueColor: '#6D28D9',
  },
  {
    //borderColor: '#06B6D4', // Teal / Cyan
    iconBg: '#ECFEFF',
    iconColor: '#0891B2',
    icon: 'monetization-on',
    valueColor: '#0E7490',
  },
  {
    //borderColor: '#EF4444', // Crimson / Red
    iconBg: '#FDF2F2',
    iconColor: '#EF4444',
    icon: 'receipt-long',
    valueColor: '#DC2626',
  },
];

function getCardTheme(index: number, balType?: string): CardTheme {
  if (balType) {
    const lower = balType.toLowerCase();
    if (lower.includes('income')) {
      return CARD_THEMES[0];
    }
    if (lower.includes('expense')) {
      return CARD_THEMES[5];
    }
    if (lower.includes('bank')) {
      return CARD_THEMES[1];
    }
    if (lower.includes('cash')) {
      return CARD_THEMES[2];
    }
  }
  return CARD_THEMES[index % CARD_THEMES.length];
}

function formatBalanceValue(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') {
    return '0.00';
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (!isNaN(num)) {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return String(val);
}

export function DashboardScreen({
  onLogout,
  onNavigateToServices,
  onNavigateToProfile,
}: DashboardScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const { language, setLanguage, t } = useLanguage();

  // API States
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await fetchBalances();
      if (data && Array.isArray(data.balances)) {
        setBalances(data.balances);
      } else {
        setBalances([]);
      }
    } catch (error) {
      console.error('Failed to load balances:', error);
      setBalances([]);
      setApiError(t('Unable to load balance data. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

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
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      setShowProfile(true);
    }
  };

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
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>GS</Text>
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.headerTitle}>{t('Lekha')}</Text>
                  <Text style={styles.headerSubtitle}>{t('Accounting Services')}</Text>
                </View>
              </View>

              {/* <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => {
                    setShowLanguageMenu(!showLanguageMenu);
                    setShowMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="language"
                    size={26}
                    color="#0B5CAD"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileAvatarButton}
                  onPress={() => {
                    setShowMenu(!showMenu);
                    setShowLanguageMenu(false);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="account-circle"
                    size={40}
                    color="#0B5CAD"
                  />
                </TouchableOpacity>
              </View> */}
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
            /* Dashboard Main Content */
            <View>
              {/* Error / Warning Banner */}
              {apiError && (
                <View style={styles.warningBanner}>
                  <View style={styles.warningBannerIconText}>
                    <MaterialIcons name="error-outline" size={20} color="#DC2626" />
                    <Text style={styles.warningBannerText}>{apiError}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bannerRetryButton}
                    onPress={loadDashboardData}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="refresh" size={15} color="#0B5CAD" />
                    <Text style={styles.bannerRetryText}>{t('Retry')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Dynamic Balance Cards / Loading / Empty States */}
              {loading ? (
                /* Loading Skeletons */
                <View style={styles.balancesList}>
                  {[1, 2, 3].map((key) => (
                    <View key={`loading-${key}`} style={[styles.balanceCard, styles.loadingCard]}>
                      <View style={[styles.balanceIconBg, { backgroundColor: '#F0F4F8' }]}>
                        {key === 1 ? <ActivityIndicator size="small" color="#0B5CAD" /> : null}
                      </View>
                      <View style={styles.balanceInfo}>
                        <View style={styles.loadingHeadingPlaceholder} />
                        <View style={styles.loadingSubheadingPlaceholder} />
                      </View>
                      <View style={styles.loadingValuePlaceholder} />
                    </View>
                  ))}
                </View>
              ) : balances.length === 0 ? (
                /* Empty State */
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconBg}>
                    <MaterialIcons name="account-balance-wallet" size={32} color="#8592A3" />
                  </View>
                  <Text style={styles.emptyCardTitle}>{t('No balance records found')}</Text>
                  <Text style={styles.emptyCardSubtitle}>
                    {apiError
                      ? t('Check network connection or try again')
                      : t('No balance accounts currently associated with this entity')}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButtonSecondary}
                    onPress={loadDashboardData}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="refresh" size={16} color="#0B5CAD" />
                    <Text style={styles.retryButtonSecondaryText}>{t('Refresh')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Dynamic Balance Cards List (WhatsApp chat-list style) */
                <View style={styles.balancesList}>
                  {balances.map((item, index) => {
                    const theme = getCardTheme(index, item.balType);
                    return (
                      <View
                        key={`balance-card-${index}`}
                        style={[
                          styles.balanceCard,
                          { borderLeftColor: theme.borderColor },
                        ]}
                      >
                        {/* Left: Avatar Icon */}
                        <View
                          style={[
                            styles.balanceIconBg,
                            { backgroundColor: theme.iconBg },
                          ]}
                        >
                          <MaterialIcons
                            name={theme.icon}
                            size={22}
                            color={theme.iconColor}
                          />
                        </View>

                        {/* Middle: Title & Subtitle */}
                        <View style={styles.balanceInfo}>
                          <Text
                            style={styles.balanceHeading}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {t(item.balType)}
                          </Text>
                          {/* <Text style={styles.balanceSubtitle}>
                            {t('Balance')}
                          </Text> */}
                        </View>

                        {/* Right: Balance Value */}
                        <View style={styles.balanceValueContainer}>
                          <Text
                            style={[styles.balanceValue, { color: theme.valueColor }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            ₹ {formatBalanceValue(item.balValue)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
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
              <Text style={styles.languageMenuTitle}>{t('Language')}</Text>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.languageItem}
                onPress={() => {
                  setLanguage('gu');
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={styles.languageItemText}>ગુજરાતી</Text>
                {language === 'gu' && (
                  <MaterialIcons name="check" size={20} color="#0B5CAD" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageItem}
                onPress={() => {
                  setLanguage('en');
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={styles.languageItemText}>English</Text>
                {language === 'en' && (
                  <MaterialIcons name="check" size={20} color="#0B5CAD" />
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningBannerIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  warningBannerText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  bannerRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  bannerRetryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B5CAD',
  },
  balancesList: {
    width: '100%',
    gap: 10,
    marginBottom: 8,
  },
  balanceCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    // borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  balanceIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  balanceHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#173B63',
    lineHeight: 19,
  },
  balanceSubtitle: {
    fontSize: 12,
    color: '#697788',
    marginTop: 2,
  },
  balanceValueContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 4,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  loadingCard: {
    borderLeftColor: '#CBD5E1',
  },
  loadingHeadingPlaceholder: {
    width: '75%',
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  loadingSubheadingPlaceholder: {
    width: '45%',
    height: 11,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 6,
  },
  loadingValuePlaceholder: {
    width: 65,
    height: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  emptyIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptyCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  retryButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF6FC',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    gap: 6,
  },
  retryButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B5CAD',
  },
  servicesCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginTop: 8,
  },
  servicesIconBg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicesContent: {
    flex: 1,
  },
  servicesTitle: {
    color: '#173B63',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  servicesDescription: {
    color: '#697788',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  servicesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicesActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B5CAD',
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
    top: Platform.OS === 'ios' ? 76 : 64,
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
});
