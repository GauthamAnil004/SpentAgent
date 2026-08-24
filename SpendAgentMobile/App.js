import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import Theme
import { COLORS } from './src/theme';

// Import API
import { getToken } from './src/api';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import XAIReasoningScreen from './screens/XAIReasoningScreen';
import PersonalFinanceScreen from './screens/PersonalFinanceScreen';
import FriendLedgerScreen from './screens/FriendLedgerScreen';
import AdminPolicyUploadScreen from './screens/AdminPolicyUploadScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Navigation Theme
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface, // Used for headers and tab bar background
    text: COLORS.text, // Text color for headers
    border: COLORS.border,
    primary: COLORS.accent, // Active tab tint
  },
};

// Simple Text Icon Component for Tabs
const TabIcon = ({ focused, label }) => (
  <Text style={{ 
    color: focused ? COLORS.accent : COLORS.textMuted,
    fontWeight: focused ? 'bold' : 'normal',
    fontSize: 10,
    marginTop: 4
  }}>
    {label}
  </Text>
);

// Tab Navigator for Logged-In Users
function MainTabs({ onLoggedOut }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarShowLabel: false, // We'll render labels via tabBarIcon
      }}
    >
      <Tab.Screen 
        name="Scan" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="SCAN" /> }}
      />
      <Tab.Screen 
        name="Finance" 
        component={PersonalFinanceScreen} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="FINANCE" /> }}
      />
      <Tab.Screen 
        name="Ledger" 
        component={FriendLedgerScreen} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="LEDGER" /> }}
      />
      <Tab.Screen 
        name="Policy" 
        component={AdminPolicyUploadScreen} 
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="POLICY" /> }}
      />
      <Tab.Screen 
        name="Profile" 
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="PROFILE" /> }}
      >
        {props => <ProfileScreen {...props} onLoggedOut={onLoggedOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await getToken();
        setIsLoggedIn(!!token);
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setIsReady(true);
      }
    };

    checkAuthStatus();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // AUTH STACK
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onLoggedIn={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          // APP STACK
          <>
            <Stack.Screen name="Main">
              {props => <MainTabs {...props} onLoggedOut={() => setIsLoggedIn(false)} />}
            </Stack.Screen>
            {/* Pushed on top of the tab bar */}
            <Stack.Screen 
              name="XAIReasoning" 
              component={XAIReasoningScreen} 
              options={{ 
                headerShown: true, 
                title: 'AI Audit Reasoning',
                headerBackTitle: 'Back',
                headerTintColor: COLORS.accent,
                headerStyle: { backgroundColor: COLORS.surface },
              }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
