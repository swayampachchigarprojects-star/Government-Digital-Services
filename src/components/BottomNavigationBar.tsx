import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

export type Screen =
  | 'login'
  | 'create-entity'
  | 'dashboard'
  | 'services'
  | 'income'
  | 'expense'
  | 'report'
  | 'transactions-report'
  | 'profile';

export type BottomNavTabId = 'dashboard' | 'transactions' | 'reports' | 'profile';

interface BottomNavigationBarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

interface NavTabItem {
  id: BottomNavTabId;
  labelKey: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  targetScreen: Screen;
}

const NAV_TABS: NavTabItem[] = [
  {
    id: 'dashboard',
    labelKey: 'Dashboard',
    icon: 'space-dashboard',
    targetScreen: 'dashboard',
  },
  {
    id: 'transactions',
    labelKey: 'Transactions',
    icon: 'receipt-long',
    targetScreen: 'services',
  },
  {
    id: 'reports',
    labelKey: 'Reports',
    icon: 'assessment',
    targetScreen: 'report',
  },
  {
    id: 'profile',
    labelKey: 'Profile',
    icon: 'person',
    targetScreen: 'profile',
  },
];

export function getActiveBottomTab(screen: Screen): BottomNavTabId | null {
  switch (screen) {
    case 'dashboard':
      return 'dashboard';
    case 'services':
      return 'transactions';
    case 'transactions-report':
    case 'income':
    case 'expense':
      return 'transactions';
    case 'report':
      return 'reports';
    case 'profile':
      return 'profile';
    default:
      return null;
  }
}

export function BottomNavigationBar({
  currentScreen,
  onNavigate,
}: BottomNavigationBarProps) {
  const { t } = useLanguage();
  const activeTabId = getActiveBottomTab(currentScreen);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {NAV_TABS.map((tab) => {
          const isActive = activeTabId === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => onNavigate(tab.targetScreen)}
              activeOpacity={0.7}
            >
              {/* Active Indicator Pill */}
              <View
                style={[
                  styles.iconWrapper,
                  isActive && styles.iconWrapperActive,
                ]}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={24}
                  color={isActive ? '#0B5CAD' : '#697788'}
                />
              </View>

              {/* Tab Title */}
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 12,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 999,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    width: 48,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  iconWrapperActive: {
    backgroundColor: '#EEF6FC',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#697788',
    textAlign: 'center',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#0B5CAD',
  },
});
