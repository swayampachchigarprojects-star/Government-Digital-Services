import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { IncomeEntryScreen } from './src/screens/IncomeEntryScreen';
import { ExpenseEntryScreen } from './src/screens/ExpenseEntryScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { TransactionsReportScreen } from './src/screens/TransactionsReportScreen';
import { LanguageProvider } from './src/contexts/LanguageContext';

type Screen = 'login' | 'dashboard' | 'services' | 'income' | 'expense' | 'report' | 'transactions-report';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLoginSuccess={() => setCurrentScreen('dashboard')} />;
      case 'dashboard':
        return (
          <DashboardScreen
            onLogout={() => setCurrentScreen('login')}
            onNavigateToServices={() => setCurrentScreen('services')}
          />
        );
      case 'services':
        return (
          <ServicesScreen
            onBack={() => setCurrentScreen('dashboard')}
            onLogout={() => setCurrentScreen('login')}
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

  return (
    <LanguageProvider>
      <StatusBar style="dark" />
      {renderScreen()}
    </LanguageProvider>
  );
}
