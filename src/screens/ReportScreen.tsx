import React from 'react';
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

interface ReportScreenProps {
  onBack: () => void;
  onNavigateToScreen: (screen: 'transactions-report') => void;
}

export function ReportScreen({ onBack, onNavigateToScreen }: ReportScreenProps) {
  const { t } = useLanguage();

  const reportModules = [
    {
      id: 'transactions',
      title: t('Transactions'),
      description: t('Generate financial reports, view visual analytics, and export summaries.'),
      icon: 'list-alt' as const,
      color: '#0B5CAD', // royal blue
      bgTint: '#EEF6FC',
      disabled: false,
    },
    {
      id: 'income-summary',
      title: t('Income Summary'),
      description: t('Review comprehensive logs of incoming revenue categorized by primary transaction heads.'),
      icon: 'trending-up' as const,
      color: '#9AA5B1', // muted gray
      bgTint: '#F4F7FA',
      disabled: true,
    },
    {
      id: 'expense-summary',
      title: t('Expense Summary'),
      description: t('Track department spending and operational expenditures over custom periods.'),
      icon: 'trending-down' as const,
      color: '#9AA5B1', // muted gray
      bgTint: '#F4F7FA',
      disabled: true,
    },
    {
      id: 'financial-overview',
      title: t('Financial Overview'),
      description: t('Analyze the consolidated balance sheets, audits, and net revenues of the administration.'),
      icon: 'pie-chart' as const,
      color: '#9AA5B1', // muted gray
      bgTint: '#F4F7FA',
      disabled: true,
    },
  ];

  const handleCardPress = (id: string, title: string, disabled: boolean) => {
    if (disabled) {
      Alert.alert(
        t('Coming Soon'),
        t('This report module is coming soon and will be available in future releases.')
      );
    } else if (id === 'transactions') {
      onNavigateToScreen('transactions-report');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.6}>
          <MaterialIcons name="arrow-back" size={24} color="#173B63" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('Report')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Section title */}
          <Text style={styles.sectionTitle}>{t('Report')}</Text>
          <Text style={styles.sectionSubtitle}>{t('Select a service module to perform operations')}</Text>

          {/* Cards List */}
          <View style={styles.cardsContainer}>
            {reportModules.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={[styles.card, report.disabled && styles.cardDisabled]}
                onPress={() => handleCardPress(report.id, report.title, report.disabled)}
                activeOpacity={report.disabled ? 1 : 0.85}
              >
                <View style={[styles.iconContainer, { backgroundColor: report.bgTint }]}>
                  <MaterialIcons name={report.icon} size={30} color={report.color} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, report.disabled && styles.cardTitleDisabled]}>
                      {report.title}
                    </Text>
                    {report.disabled && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>{t('Coming Soon')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDescription}>{report.description}</Text>
                  
                  {!report.disabled && (
                    <View style={styles.cardFooter}>
                      <Text style={[styles.cardActionText, { color: report.color }]}>
                        {t('Open Service')}
                      </Text>
                      <MaterialIcons name="chevron-right" size={18} color={report.color} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  cardDisabled: {
    borderColor: '#E4EBF2',
    backgroundColor: '#F9FAFC',
    elevation: 1,
    shadowOpacity: 0.02,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#173B63',
    fontSize: 16,
    fontWeight: '700',
  },
  cardTitleDisabled: {
    color: '#7B8794',
  },
  comingSoonBadge: {
    backgroundColor: '#E4EBF2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#697788',
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
});
