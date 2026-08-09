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

interface ServicesScreenProps {
  onLogout: () => void;
  onNavigateToScreen: (screen: 'income' | 'expense') => void;
}

export function ServicesScreen({ onLogout, onNavigateToScreen }: ServicesScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleCardPress = (serviceName: string, id: string) => {
    if (id === 'income' || id === 'expense') {
      onNavigateToScreen(id);
    } else {
      Alert.alert(
        'Service Selected',
        `You have opened the "${serviceName}" service module.`
      );
    }
  };

  const handleLogoutPress = () => {
    setShowMenu(false);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from the portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout }
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
      title: 'Income Entry',
      description: 'Record incoming revenue, agricultural yields, and other income sources securely.',
      icon: 'account-balance-wallet' as const,
      color: '#10B981', // green
      bgTint: '#E6F8F3',
    },
    {
      id: 'expense',
      title: 'Expense Entry',
      description: 'Log administrative expenditures, purchases, and operational costs.',
      icon: 'payment' as const,
      color: '#EF4444', // crimson/red
      bgTint: '#FDF2F2',
    },
    {
      id: 'report',
      title: 'Report',
      description: 'Generate financial reports, view visual analytics, and export summaries.',
      icon: 'assessment' as const,
      color: '#0B5CAD', // royal blue
      bgTint: '#EEF6FC',
    },
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
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>GS</Text>
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.headerTitle}>Government Digital Services</Text>
                  <Text style={styles.headerSubtitle}>Administration Services</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.profileAvatarButton}
                onPress={() => setShowMenu(!showMenu)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="account-circle" size={40} color="#0B5CAD" />
              </TouchableOpacity>
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
                  <Text style={styles.backButtonText}>Back to Services</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileCard}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileAvatarLargeText}>TA</Text>
                </View>
                <Text style={styles.profileName}>Nimesh Patel</Text>
                <Text style={styles.profileRole}>Village Officer (Talati)</Text>

                <View style={styles.profileDivider} />

                <View style={styles.detailRow}>
                  <MaterialIcons name="email" size={20} color="#697788" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Email Address</Text>
                    <Text style={styles.detailValue}>citizen.admin@gov.in</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="business" size={20} color="#697788" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Department</Text>
                    <Text style={styles.detailValue}>Revenue & Land Records</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="badge" size={20} color="#697788" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Employee ID</Text>
                    <Text style={styles.detailValue}>EMP-2026-8849</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <MaterialIcons name="verified" size={20} color="#10B981" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '700' }]}>Active / On Duty</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.backToServicesBtn}
                  onPress={() => setShowProfile(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backToServicesBtnText}>Back to Services</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Services Grid View */
            <View>
              {/* Section title */}
              <Text style={styles.sectionTitle}>Services</Text>
              <Text style={styles.sectionSubtitle}>Select a service module to perform operations</Text>

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
                      <MaterialIcons name={service.icon} size={30} color={service.color} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{service.title}</Text>
                      <Text style={styles.cardDescription}>{service.description}</Text>
                      <View style={styles.cardFooter}>
                        <Text style={[styles.cardActionText, { color: service.color }]}>Open Service</Text>
                        <MaterialIcons name="chevron-right" size={18} color={service.color} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Footer branding */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure connection encrypted with AES-256</Text>
            <Text style={styles.craftedText}>Crafted by hands</Text>
          </View>
        </View>
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
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={[styles.menuItem, styles.menuItemLogout]} onPress={handleLogoutPress}>
              <MaterialIcons name="logout" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.menuItemTextLogout]}>Logout</Text>
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
    gap: 16,
  },
  card: {
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
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#173B63',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
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
