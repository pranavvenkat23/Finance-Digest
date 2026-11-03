import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { TabBarIcon } from '@/components/ui/TabBarIcon';
import { useTheme } from '@/lib/theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.inkMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.line,
          ...(Platform.OS === 'android' ? { height: 64, paddingBottom: 8, paddingTop: 8 } : {}),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <TabBarIcon name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="receipt"
        options={{ title: 'Taxes', tabBarIcon: ({ color, size }) => <TabBarIcon name="receipt" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="local"
        options={{ title: 'Local', tabBarIcon: ({ color, size }) => <TabBarIcon name="map" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="news"
        options={{ title: 'News', tabBarIcon: ({ color, size }) => <TabBarIcon name="news" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="stocks"
        options={{ title: 'Stocks', tabBarIcon: ({ color, size }) => <TabBarIcon name="chart" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="finai"
        options={{ title: 'FinAI', tabBarIcon: ({ color, size }) => <TabBarIcon name="robot" color={color} size={size} /> }}
      />
      {/* Reachable from in-app links, hidden from the tab bar. */}
      <Tabs.Screen name="what-if" options={{ href: null }} />
      <Tabs.Screen name="sources" options={{ href: null }} />
    </Tabs>
  );
}
