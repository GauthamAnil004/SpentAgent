import React from 'react';
import { TextInput, TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from './theme';

export const Input = ({ style, ...props }) => {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={COLORS.textMuted}
      {...props}
    />
  );
};

export const Button = ({ title, onPress, variant = 'primary', loading = false, style, textStyle, ...props }) => {
  const isPrimary = variant === 'primary';
  const buttonStyle = isPrimary ? styles.buttonPrimary : styles.buttonSecondary;
  const textVariantStyle = isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary;

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, style]}
      onPress={onPress}
      disabled={loading || props.disabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? COLORS.text : COLORS.accent} />
      ) : (
        <Text style={[styles.buttonText, textVariantStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export const Card = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

export const ScreenTitle = ({ title, subtitle, style, ...props }) => {
  return (
    <View style={[styles.titleContainer, style]} {...props}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

export const ErrorText = ({ error, style, ...props }) => {
  if (!error) return null;
  return (
    <Text style={[styles.errorText, style]} {...props}>
      {error}
    </Text>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT.size.md,
    marginBottom: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: COLORS.accent,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  buttonText: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  buttonTextPrimary: {
    color: COLORS.text,
  },
  buttonTextSecondary: {
    color: COLORS.accent,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  titleContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT.size.sm,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT.size.sm,
    marginTop: -SPACING.sm, // pull up slightly towards the field above
    marginBottom: SPACING.md,
  },
});
