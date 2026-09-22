import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors } from '../../theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

// The bottom tab bar.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{ title: 'Learn', headerShown: false, tabBarIcon: tabIcon('book') }}
      />
      <Tabs.Screen name="tools" options={{ title: 'Tools', tabBarIcon: tabIcon('timer') }} />
      <Tabs.Screen name="ear" options={{ title: 'Ear training', tabBarIcon: tabIcon('ear') }} />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('settings') }}
      />
    </Tabs>
  );
}
