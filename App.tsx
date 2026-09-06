import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { IncomeEntryScreen } from './src/screens/IncomeEntryScreen';
import { ExpenseEntryScreen } from './src/screens/ExpenseEntryScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { TransactionsReportScreen } from './src/screens/TransactionsReportScreen';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

type Screen = 'login' | 'dashboard' | 'services' | 'income' | 'expense' | 'report' | 'transactions-report';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const { isAuthenticated, isHydrating, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && currentScreen !== 'login') setCurrentScreen('login');
  }, [currentScreen, isAuthenticated]);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0B5CAD" />
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLoginSuccess={() => setCurrentScreen('dashboard')} />;
      case 'dashboard':
        return (
          <DashboardScreen
            onLogout={() => { void logout(); setCurrentScreen('login'); }}
            onNavigateToServices={() => setCurrentScreen('services')}
          />
        );
      case 'services':
        return (
          <ServicesScreen
            onBack={() => setCurrentScreen('dashboard')}
            onLogout={() => { void logout(); setCurrentScreen('login'); }}
            onNavigateToScreen={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'income':
        return <IncomeEntryScreen onBack={() => setCurrentScreen('services')} />;
      case 'expense':
        return <ExpenseEntryScreen onBack={() => setCurrentScreen('services')} />;
      case 'report':
        return (
          <ReportScreen
            onBack={() => setCurrentScreen('services')}
            onNavigateToScreen={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'transactions-report':
        return <TransactionsReportScreen onBack={() => setCurrentScreen('report')} />;
      default:
        return <LoginScreen onLoginSuccess={() => setCurrentScreen('dashboard')} />;
    }
  };

  return <><StatusBar style="dark" />{renderScreen()}</>;
}
