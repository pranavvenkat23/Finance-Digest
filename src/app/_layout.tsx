import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Palettes } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';
import { useUserStore } from '@/store/userStore';
import { useWatchlistStore } from '@/store/watchlistStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? Palettes.dark : Palettes.light;
  const hydrate = useUserStore((s) => s.hydrate);
  const hydrateAi = useAiStore((s) => s.hydrate);
  const hydrateWatchlist = useWatchlistStore((s) => s.hydrate);

  // Load persisted state (income/ZIP, AI key, watchlist) once on launch.
  useEffect(() => {
    void hydrate();
    void hydrateAi();
    void hydrateWatchlist();
  }, [hydrate, hydrateAi, hydrateWatchlist]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: palette.appBg,
      card: palette.surface,
      text: palette.ink,
      border: palette.line,
      primary: palette.accent,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.appBg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
