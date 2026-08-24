import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Input, Button, ErrorText, ScreenTitle } from '../src/components';
import { COLORS, SPACING, FONT } from '../src/theme';
import { loginUser, saveToken, getErrorMessage } from '../src/api';

export default function LoginScreen({ navigation, onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await loginUser(email, password);
      // Access token and name depending on the exact backend response shape
      const { access_token } = response.data;
      const name = response.data.name || (response.data.user && response.data.user.name) || '';
      
      await saveToken(access_token, name);
      
      if (onLoggedIn) {
        onLoggedIn();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenTitle title="Welcome Back" subtitle="Login to your SpendAgent account" />
        
        <Input
          testID="email-input"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Input
          testID="password-input"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <ErrorText error={error} />

        <Button
          testID="login-button"
          title="Login"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginButton}
        />
        
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.signupLink}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkHighlight}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  linksContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.textMuted,
    fontSize: FONT.size.md,
    marginBottom: SPACING.md,
  },
  linkHighlight: {
    color: COLORS.accent,
    fontWeight: FONT.weight.bold,
  },
  signupLink: {
    marginTop: SPACING.sm,
  }
});
