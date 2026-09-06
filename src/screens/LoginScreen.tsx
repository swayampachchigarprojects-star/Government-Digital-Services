import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/apiClient';
import { authService } from '../services/authService';
import { useGoogleAuth } from '../services/googleAuth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { t } = useLanguage();
  const { setSession } = useAuth();
  const googleAuth = useGoogleAuth();
  const [accountingEntityId, setAccountingEntityId] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const handleGoogleAuth = async () => {
    if (isAuthenticating) return;
    if (!accountingEntityId.trim()) {
      Alert.alert(t('Validation Error'), t('Accounting entity ID is required'));
      return;
    }
    setIsAuthenticating(true);
    try {
      const googleResult = await googleAuth.signIn();
      if (googleResult.type === 'cancelled') {
        Alert.alert(t('Sign In'), t('Google sign-in was cancelled.'));
        return;
      }
      if (googleResult.type !== 'success') {
        Alert.alert(t('Sign In'), t(googleResult.message));
        return;
      }
      const token = await authService.signupWithGoogle(
        googleResult.idToken,
        accountingEntityId.trim(),
      );
      await setSession(token);
      onLoginSuccess();
    } catch (error) {
      const message = error instanceof ApiError && error.status === 403
        ? t('Your account is not registered. Please contact your administrator.')
        : error instanceof ApiError && error.status === 0
          ? t('Unable to connect to the server. Please try again.')
          : error instanceof Error && error.message === 'The authentication response was invalid.'
            ? t('Unable to sign in with Google. Please try again.')
            : t('Unable to sign in with Google. Please try again.');
      Alert.alert(t('Sign In'), message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(t('Support'), t('Redirecting to Government Digital Services Support Center.'));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Card Container */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('Lekha')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('Sign in to access Accounting Services')}
              </Text>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={[styles.googleBtn, isAuthenticating && styles.disabledButton]}
                onPress={() => { void handleGoogleAuth(); }}
                disabled={isAuthenticating}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                {isAuthenticating ? <ActivityIndicator color="#0B5CAD" /> : <Text style={styles.googleBtnText}>{t('Google')}</Text>}
              </TouchableOpacity>

              <View style={styles.signupSection}>
                <Text style={styles.signupTitle}>{t('Accounting entity')}</Text>
                <TextInput
                  style={styles.input}
                  value={accountingEntityId}
                  onChangeText={setAccountingEntityId}
                  placeholder={t('Accounting entity ID')}
                  placeholderTextColor="#9AA5B1"
                  autoCapitalize="none"
                  accessibilityLabel={t('Accounting entity ID')}
                  editable={!isAuthenticating}
                />
              </View>

              {/* Footer Links */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  {t('Need assistance?')}{' '}
                  <Text style={styles.footerLink} onPress={handleContactSupport}>
                    {t('Contact Support')}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0B5CAD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    // Android elevation
    elevation: 6,
    // iOS shadow
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#173B63',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#667585',
    fontSize: 15,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    // Android elevation
    elevation: 4,
    // iOS shadow
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#173B63',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: '#697788',
    fontSize: 14,
    marginBottom: 24,
  },
  bannerErrorContainer: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  bannerErrorText: {
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: '#354052',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 52,
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#173B63',
  },
  inputFocused: {
    borderColor: '#0B5CAD',
    // Glow effect for web/ios/android if supported
    shadowColor: '#0B5CAD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  fieldErrorText: {
    color: '#E53E3E',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 64,
  },
  togglePasswordButton: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePasswordText: {
    color: '#0B5CAD',
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: '#0B5CAD',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8E2EC',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#7B8794',
    fontSize: 13,
    fontWeight: '500',
  },
  googleBtn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    borderColor: '#D8E2EC',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    color: '#354052',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signupSection: {
    marginTop: 24,
    gap: 12,
  },
  signupTitle: {
    color: '#354052',
    fontSize: 14,
    fontWeight: '600',
  },
  signupBtn: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E8F1FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupBtnText: {
    color: '#0B5CAD',
    fontSize: 15,
    fontWeight: '600',
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#7A8795',
  },
  footerLink: {
    color: '#0B5CAD',
    fontWeight: '600',
  },
  craftedText: {
    marginTop: 4,
  },
});
