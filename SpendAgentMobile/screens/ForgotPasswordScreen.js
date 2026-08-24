import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Input, Button, ErrorText, ScreenTitle } from '../src/components';
import { COLORS, SPACING, FONT } from '../src/theme';
import { forgotPassword, verifyOtp, resetPassword, getErrorMessage } from '../src/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [stage, setStage] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await forgotPassword(email);
      setStage(2);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await verifyOtp(email, otp);
      setResetToken(response.data.reset_token || response.data.token || '');
      setStage(3);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await resetPassword(resetToken, newPassword);
      Alert.alert(
        "Password Reset Successful",
        "Your password has been reset successfully. Please login with your new password.",
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
        
        {stage === 1 && (
          <View>
            <ScreenTitle title="Reset Password" subtitle="Enter your email to receive a 6-digit OTP" />
            <Input
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <ErrorText error={error} />
            <Button 
              title="Send OTP" 
              onPress={handleSendOtp} 
              loading={loading} 
              style={styles.actionButton} 
            />
          </View>
        )}

        {stage === 2 && (
          <View>
            <ScreenTitle title="Verify OTP" subtitle={`Enter the 6-digit code sent to ${email}`} />
            <Input
              placeholder="6-Digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <ErrorText error={error} />
            <Button 
              title="Verify Code" 
              onPress={handleVerifyOtp} 
              loading={loading} 
              style={styles.actionButton} 
            />
            <Button 
              title="Resend OTP" 
              variant="secondary"
              onPress={handleSendOtp} 
              loading={loading} 
              style={styles.secondaryButton} 
            />
          </View>
        )}

        {stage === 3 && (
          <View>
            <ScreenTitle title="New Password" subtitle="Enter your new secure password" />
            <Input
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="password"
            />
            <ErrorText error={error} />
            <Button 
              title="Reset Password" 
              onPress={handleResetPassword} 
              loading={loading} 
              style={styles.actionButton} 
            />
          </View>
        )}
        
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Back to Login</Text>
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
  actionButton: {
    marginTop: SPACING.md,
  },
  secondaryButton: {
    marginTop: SPACING.md,
  },
  linksContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  }
});
