import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { IncomeEntryScreen } from './src/screens/IncomeEntryScreen';
import { ExpenseEntryScreen } from './src/screens/ExpenseEntryScreen';

type Screen = 'login' | 'services' | 'income' | 'expense';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLoginSuccess={() => setCurrentScreen('services')} />;
      case 'services':
        return (
          <ServicesScreen
            onLogout={() => setCurrentScreen('login')}
            onNavigateToScreen={(screen) => setCurrentScreen(screen)}
          />
        );
      case 'income':
        return <IncomeEntryScreen onBack={() => setCurrentScreen('services')} />;
      case 'expense':
        return <ExpenseEntryScreen onBack={() => setCurrentScreen('services')} />;
      default:
        return <LoginScreen onLoginSuccess={() => setCurrentScreen('services')} />;
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      {renderScreen()}
    </>
  );
}
