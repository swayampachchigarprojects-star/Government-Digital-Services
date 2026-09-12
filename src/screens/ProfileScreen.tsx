import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserProfile, getCachedUserProfile, UserProfile } from '../services/userService';
import { getAccountEntity, getCachedEntityData } from '../services/entityService';
import { fetchPaymentTypes, PaymentType } from '../services/transactionService';

interface ProfileScreenProps {
  onBack?: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  // Local state initialized with cached or auth data, then updated when APIs resolve
  const [profileUser, setProfileUser] = useState<UserProfile | null>(() => getCachedUserProfile());
  const [entityData, setEntityData] = useState<Record<string, unknown> | null>(() => getCachedEntityData());
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loadingPaymentTypes, setLoadingPaymentTypes] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // On clicking Profile, call GET /account-entity, GET /users, and fetchPaymentTypes()
    const loadProfileData = async () => {
      try {
        const [fetchedUser, fetchedAccountEntity, fetchedPaymentTypes] = await Promise.all([
          fetchUserProfile(true),
          getAccountEntity(),
          fetchPaymentTypes(),
        ]);

        if (isMounted) {
          if (fetchedUser) setProfileUser(fetchedUser);
          if (fetchedAccountEntity) setEntityData(fetchedAccountEntity);
          if (fetchedPaymentTypes && fetchedPaymentTypes.length > 0) {
            setPaymentTypes(fetchedPaymentTypes);
          } else if (fetchedAccountEntity) {
            const entityId = (fetchedAccountEntity?.id ||
              fetchedAccountEntity?.accountEntityId ||
              fetchedAccountEntity?.accountingEntityId) as string | undefined;
            if (entityId) {
              const retryPaymentTypes = await fetchPaymentTypes(entityId);
              if (isMounted && retryPaymentTypes) setPaymentTypes(retryPaymentTypes);
            }
          }
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[ProfileScreen] Error fetching profile/account-entity/payment-types data:', err);
        }
      } finally {
        if (isMounted) {
          setLoadingPaymentTypes(false);
        }
      }
    };

    void loadProfileData();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayValue = (value: string | undefined | null) => value?.trim() || '-';
  const roleValue = (profileUser?.roles || user?.roles)?.length
    ? (profileUser?.roles || user?.roles)!.join(', ')
    : '-';

  // Resolved user fields from GET /users with fallback to auth context
  const firstName = profileUser?.firstName ?? user?.firstName ?? '';
  const lastName = profileUser?.lastName ?? user?.lastName ?? '';
  const email = profileUser?.email ?? user?.email ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || user?.name || '';

  // Avatar initials
  const initials =
    ((firstName.charAt(0) || '') + (lastName.charAt(0) || '')).toUpperCase() || 'TA';

  // Resolved entity fields from GET /account-entity with fallback to auth context
  const entityName =
    (entityData?.name as string) ??
    (entityData?.accountingEntityName as string) ??
    (entityData?.entityName as string) ??
    user?.accountingEntityName ??
    '';
  const rawStatus =
    (entityData?.status as string) ||
    ((user as Record<string, unknown> | null)?.status as string) ||
    'Active';
  const entityStatus = t(rawStatus) || rawStatus;
  const rawDistrict = (entityData?.district as string) ?? user?.district ?? '';
  const entityDistrict = rawDistrict ? t(rawDistrict) || rawDistrict : '';
  const entityTaluka = (entityData?.taluka as string) ?? user?.taluka ?? '';
  const entityVillage = (entityData?.village as string) ?? user?.village ?? '';

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `${t('Sign Out')}\n\n${t('Are you sure you want to sign out from the portal?')}`,
      );
      if (confirmed) onLogout();
      return;
    }

    Alert.alert(
      t('Sign Out'),
      t('Are you sure you want to sign out from the portal?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Sign Out'), style: 'destructive', onPress: onLogout },
      ]
    );
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
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatarLarge}>
              <Text style={styles.profileAvatarLargeText}>{initials}</Text>
            </View>
            <Text style={styles.profileName}>{displayValue(fullName)}</Text>
            <Text style={styles.profileRole}>{roleValue}</Text>

            <View style={styles.profileDivider} />

            <View style={styles.detailRow}>
              <MaterialIcons name="person-outline" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('First Name')}</Text>
                <Text style={styles.detailValue}>{displayValue(firstName)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="person-outline" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('Last Name')}</Text>
                <Text style={styles.detailValue}>{displayValue(lastName)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('Email Address')}</Text>
                <Text style={styles.detailValue}>{displayValue(email)}</Text>
              </View>
            </View>

          </View>

          {/* Accounting Entity Card */}
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{t('Accounting Entity')}</Text>
            {/* <TouchableOpacity style={{position: 'absolute', top: 30, right: 16}}>
              <MaterialIcons name="edit" size={20} style={styles.editIcon} />
            </TouchableOpacity> */}
            <View style={styles.profileDivider} />

            <View style={styles.detailRow}>
              <MaterialIcons name="business" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('Entity Name')}</Text>
                <Text style={styles.detailValue}>{displayValue(entityName)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="verified-user" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('Status')}</Text>
                <Text style={styles.detailValue}>{displayValue(entityStatus)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="location-city" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('District')}</Text>
                <Text style={styles.detailValue}>{displayValue(entityDistrict)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="map" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('Taluka')}</Text>
                <Text style={styles.detailValue}>{displayValue(entityTaluka)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="home" size={20} color="#697788" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t('Village')}</Text>
                <Text style={styles.detailValue}>{displayValue(entityVillage)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Types Card */}
          <View style={styles.profileCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.profileName}>{t('Payment Types')}</Text>
              {/* {paymentTypes.length > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{paymentTypes.length}</Text>
                </View>
              )} */}
            </View>
            <View style={styles.profileDivider} />

            {loadingPaymentTypes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0B5CAD" />
                <Text style={styles.loadingSubtext}>{t('Loading...')}</Text>
              </View>
            ) : paymentTypes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="account-balance-wallet" size={32} color="#BAC4D0" />
                <Text style={styles.emptySubtext}>{t('No payment types found')}</Text>
              </View>
            ) : (
              <View style={styles.paymentTypeList}>
                {paymentTypes.map((pt, index) => {
                  const label = pt.paymentType || pt.name || '-';
                  const displayLabel = t(label) || label;

                  return (
                    <View
                      key={pt.paymentTypeId || `${label}-${index}`}
                      style={[
                        styles.paymentTypeRow,
                        index === paymentTypes.length - 1 && styles.paymentTypeRowLast,
                      ]}
                    >
                      <View style={styles.paymentTypeIconCircle}>
                        <MaterialIcons name="account-balance-wallet" size={18} color="#0B5CAD" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        {/* <Text style={styles.detailLabel}>
                          {t('Payment Type')} #{index + 1}
                        </Text> */}
                        <Text style={styles.paymentTypeName}>{displayLabel}</Text>
                      </View>
                      {typeof pt.balance === 'number' && (
                        <View style={styles.balanceBadge}>
                          <Text style={styles.balanceBadgeText}>
                            ₹ {pt.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Preferences Card */}
          {/* <View style={styles.settingsCard}>
            <Text style={styles.cardHeaderTitle}>{t('Language')}</Text>

            <View style={styles.languageToggleRow}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  language === 'gu' && styles.languageOptionActive,
                ]}
                onPress={() => setLanguage('gu')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    language === 'gu' && styles.languageOptionTextActive,
                  ]}
                >
                  ગુજરાતી
                </Text>
                {language === 'gu' && (
                  <MaterialIcons name="check" size={18} color="#0B5CAD" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  language === 'en' && styles.languageOptionActive,
                ]}
                onPress={() => setLanguage('en')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    language === 'en' && styles.languageOptionTextActive,
                  ]}
                >
                  English
                </Text>
                {language === 'en' && (
                  <MaterialIcons name="check" size={18} color="#0B5CAD" />
                )}
              </TouchableOpacity>
            </View>
          </View> */}

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>{t('Sign Out')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginBottom: 16,
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
  editIcon: {
    color: '#173B63',
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
    flex: 1,
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
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeaderTitle: {
    color: '#173B63',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  languageToggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  languageOptionActive: {
    borderColor: '#0B5CAD',
    backgroundColor: '#EEF6FC',
  },
  languageOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#697788',
  },
  languageOptionTextActive: {
    color: '#0B5CAD',
  },
  logoutButton: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    backgroundColor: '#FFF5F5',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  badgeCount: {
    backgroundColor: '#EEF6FC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#D0E2F5',
  },
  badgeCountText: {
    color: '#0B5CAD',
    fontSize: 12,
    fontWeight: '700',
  },
  paymentTypeList: {
    width: '100%',
  },
  paymentTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    gap: 14,
  },
  paymentTypeRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  paymentTypeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF6FC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E2F5',
  },
  paymentTypeName: {
    fontSize: 14,
    color: '#173B63',
    fontWeight: '600',
  },
  balanceBadge: {
    backgroundColor: '#F4F7FA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E4EBF2',
  },
  balanceBadgeText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#697788',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#8B96A5',
  },
});
