import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Button, Card, ScreenTitle } from '../src/components';
import { COLORS, SPACING, FONT } from '../src/theme';
import { getUserName, clearToken } from '../src/api';

export default function ProfileScreen({ onLoggedOut }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const name = await getUserName();
      setUserName(name || 'User');
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await clearToken();
    if (onLoggedOut) {
      onLoggedOut();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTitle title="Profile" subtitle="Manage your account settings" />

      <Card style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
        </View>
        <Text style={styles.userName}>{userName || 'User'}</Text>
      </Card>

      <Button 
        title="Log Out" 
        variant="secondary" 
        onPress={handleLogout} 
        style={styles.logoutButton}
        textStyle={styles.logoutText}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  profileCard: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xxl, 
    marginBottom: SPACING.xl 
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
  },
  userName: {
    color: COLORS.text,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  logoutButton: {
    borderColor: COLORS.danger,
  },
  logoutText: {
    color: COLORS.danger,
  }
});
