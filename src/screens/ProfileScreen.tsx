import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileScreenProps {
  onBack?: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLogoutPress = () => {
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
                <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '700' }]}>
                  {t('Active / On Duty')}
                </Text>
              </View>
            </View>
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
});
