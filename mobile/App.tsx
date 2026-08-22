import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, NeuShadow } from './src/theme/tokens';
import PermissionGate from './src/components/PermissionGate';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import ZonesScreen from './src/screens/ZonesScreen';
import CamerasScreen from './src/screens/CamerasScreen';
import DeviceCameraScreen from './src/screens/DeviceCameraScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import MissingScreen from './src/screens/MissingScreen';
import TeamsScreen from './src/screens/TeamsScreen';
import IncidentsScreen from './src/screens/IncidentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();

const SCREEN_CONFIG: Record<string, { icon: string; commanderOnly?: boolean }> = {
  'Dashboard': { icon: 'grid' },
  'Zones': { icon: 'map' },
  'Cameras': { icon: 'videocam', commanderOnly: true },
  'Device Cam': { icon: 'phone-portrait' },
  'Alerts': { icon: 'bell' },
  'Missing': { icon: 'search' },
  'Incidents': { icon: 'alert-circle', commanderOnly: true },
  'Assistant': { icon: 'brain', commanderOnly: true },
  'Teams': { icon: 'people', commanderOnly: true },
  'Profile': { icon: 'person' },
};

const TAB_ICONS: Record<string, string> = {
  'Dashboard': 'grid', 'Zones': 'map', 'Cameras': 'videocam', 'Device Cam': 'phone-portrait',
  'Alerts': 'notifications', 'Missing': 'search', 'Incidents': 'alert-circle', 'Assistant': 'chatbubble-ellipses',
  'Teams': 'people', 'Profile': 'person',
};

const TAB_ICONS_OUT: Record<string, string> = {
  'Dashboard': 'grid-outline', 'Zones': 'map-outline', 'Cameras': 'videocam-outline', 'Device Cam': 'phone-portrait-outline',
  'Alerts': 'notifications-outline', 'Missing': 'search', 'Incidents': 'alert-circle-outline', 'Assistant': 'chatbubble-ellipses-outline',
  'Teams': 'people-outline', 'Profile': 'person-outline',
};

function AppTabs({ role }: { role: 'OPERATOR' | 'COMMANDER' }) {
  const screenNames = Object.keys(SCREEN_CONFIG).filter(
    name => !SCREEN_CONFIG[name].commanderOnly || role === 'COMMANDER'
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? (TAB_ICONS[route.name] || 'ellipse') : (TAB_ICONS_OUT[route.name] || 'ellipse-outline');
          return <Ionicons name={iconName as any} size={20} color={color} />;
        },
        tabBarActiveTintColor: Colors.red,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 10, 15, 0.95)',
          borderTopColor: Colors.glassBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          ...NeuShadow.lg,
        },
        tabBarLabelStyle: { fontSize: FontSize.xs - 1, fontWeight: '600', letterSpacing: 0.2 },
        headerStyle: { backgroundColor: 'rgba(10, 10, 15, 0.95)', borderBottomColor: Colors.glassBorder, borderBottomWidth: 1 },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: FontSize.lg, letterSpacing: 0.5 },
      })}
    >
      {screenNames.map(name => (
        <Tab.Screen key={name} name={name} component={
          name === 'Dashboard' ? DashboardScreen :
          name === 'Zones' ? ZonesScreen :
          name === 'Cameras' ? CamerasScreen :
          name === 'Device Cam' ? DeviceCameraScreen :
          name === 'Alerts' ? AlertsScreen :
          name === 'Missing' ? MissingScreen :
          name === 'Incidents' ? IncidentsScreen :
          name === 'Assistant' ? AssistantScreen :
          name === 'Teams' ? TeamsScreen :
          ProfileScreen
        } />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'OPERATOR' | 'COMMANDER'>('COMMANDER');

  if (!isLoggedIn) {
    return (
      <PermissionGate>
        <StatusBar style="light" />
        <LoginScreen onLogin={(r) => { setRole(r); setIsLoggedIn(true); }} />
      </PermissionGate>
    );
  }

  return (
    <PermissionGate>
      <StatusBar style="light" />
      <NavigationContainer>
        <AppTabs role={role} />
      </NavigationContainer>
    </PermissionGate>
  );
}
