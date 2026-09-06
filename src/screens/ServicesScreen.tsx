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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';

interface ServicesScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToScreen: (screen: 'income' | 'expense') => void;
}

export function ServicesScreen({ onBack, onLogout, onNavigateToScreen }: ServicesScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const { language, setLanguage, t } = useLanguage();

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
});
