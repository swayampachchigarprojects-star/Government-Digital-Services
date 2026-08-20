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
} from 'react-native';
import { useLanguage } from '../../src/contexts/LanguageContext';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    let isValid = true;
    let errEmail = '';
    let errPassword = '';
    let errGeneral = '';

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail && !trimmedPassword) {
      errEmail = t('Email address is required');
      errPassword = t('Password is required');
      errGeneral = t('Please enter your email address and password to sign in.');
      isValid = false;
    } else {
      if (!trimmedEmail) {
        errEmail = t('Email address is required');
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
        errEmail = t('Please enter a valid email address');
        isValid = false;
      }

      if (!trimmedPassword) {
        errPassword = t('Password is required');
        isValid = false;
      }
    }

    setEmailError(errEmail);
    setPasswordError(errPassword);
    setGeneralError(errGeneral);

    return isValid;
  };

  const handleLogin = () => {
    if (!validateForm()) {
      if (!email.trim() && !password.trim()) {
        Alert.alert(t('Validation Error'), t('Please enter your email address and password.'));
      } else if (!email.trim()) {
        Alert.alert(t('Validation Error'), t('Please enter your email address.'));
      } else if (!password.trim()) {
        Alert.alert(t('Validation Error'), t('Please enter your password.'));
      } else if (emailError) {
        Alert.alert(t('Validation Error'), emailError);
      }
      return;
    }

    onLoginSuccess();
  };

  const handleGoogleLogin = () => {
    onLoginSuccess();
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
              <Text style={styles.sectionTitle}>{t('Government Digital Services')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('Sign in to access your services securely.')}
              </Text>

              {/* General Error Banner */}
              {!!generalError && (
                <View style={styles.bannerErrorContainer}>
                  <Text style={styles.bannerErrorText}>{generalError}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('Email Address')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    isEmailFocused && styles.inputFocused,
                    !!emailError && styles.inputError,
                  ]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                    if (generalError) setGeneralError('');
                  }}
                  placeholder={t('Enter your email address')}
                  placeholderTextColor="#8B96A5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
                {!!emailError && (
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('Password')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      isPasswordFocused && styles.inputFocused,
                      !!passwordError && styles.inputError,
                    ]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                      if (generalError) setGeneralError('');
                    }}
                    placeholder={t('Enter your password')}
                    placeholderTextColor="#8B96A5"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    style={styles.togglePasswordButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.togglePasswordText}>
                      {showPassword ? t('Hide') : t('Show')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {!!passwordError && (
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                )}
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>{t('Sign In')}</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('OR')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleBtnText}>{t('Continue with Google')}</Text>
              </TouchableOpacity>

              {/* Footer Links */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  {t('Need assistance?')}{' '}
                  <Text style={styles.footerLink} onPress={handleContactSupport}>
                    {t('Contact Support')}
                  </Text>
                </Text>
                <Text style={[styles.footerText, styles.craftedText]}>
                  {t('Crafted by hands')}
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
