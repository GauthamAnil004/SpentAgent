import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Input, Button, ErrorText, ScreenTitle } from '../src/components';
import { COLORS, SPACING, FONT } from '../src/theme';
import { registerUser, getErrorMessage } from '../src/api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await registerUser(name, email, password);
      Alert.alert(
        "Registration Successful",
        "Your account has been created successfully. Please login.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
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
        <ScreenTitle title="Create Account" subtitle="Sign up for SpendAgent" />
        
        <Input
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
        />

        <Input
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        
        <ErrorText error={error} />
        
        <Button 
          title="Sign Up" 
          onPress={handleRegister} 
          loading={loading} 
          style={styles.registerButton} 
        />
        
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkHighlight}>Login</Text>
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
  registerButton: {
    marginTop: SPACING.md,
  },
  linksContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.textMuted,
    fontSize: FONT.size.md,
  },
  linkHighlight: {
    color: COLORS.accent,
    fontWeight: FONT.weight.bold,
  }
});
