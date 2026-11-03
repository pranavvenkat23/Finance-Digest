/**
 * Shown when no Groq API key is set. Explains the one-time, free, no-payment
 * setup and lets the user paste their key. Reused by News, Stocks, and FinAI.
 */

import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SourceLink } from '@/components/ui/SourceLink';
import { Text } from '@/components/ui/Text';
import { GROQ_KEYS_URL } from '@/lib/constants';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';

export function ConnectAI({ compact }: { compact?: boolean }) {
  const theme = useTheme();
  const setKey = useAiStore((s) => s.setKey);
  const [value, setValue] = useState('');

  return (
    <View
      style={{
        padding: Space.lg,
        borderRadius: Radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.line,
        gap: Space.md,
      }}>
      <Text variant="headline">Turn on AI (free)</Text>
      {!compact && (
        <Text variant="body" color="inkSecondary">
          The AI features use Groq, which is free. Create one free key (no credit card), paste it
          below, and it stays on your device. You only do this once.
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: Space.sm }}>
        <Text variant="caption" color="inkMuted">
          1. Get a free key:
        </Text>
        <SourceLink url={GROQ_KEYS_URL} label="console.groq.com/keys" variant="caption" />
      </View>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="2. Paste your Groq key (gsk_...)"
        placeholderTextColor={theme.colors.inkMuted}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        accessibilityLabel="Groq API key"
        style={{
          backgroundColor: theme.colors.appBg,
          borderColor: theme.colors.line,
          borderWidth: 1,
          borderRadius: Radius.md,
          paddingHorizontal: Space.lg,
          paddingVertical: Space.md,
          color: theme.colors.ink,
          fontSize: 15,
        }}
      />
      <Button
        label="Save key and enable AI"
        onPress={() => value.trim() && setKey(value.trim())}
        disabled={!value.trim()}
      />
      <Text variant="caption" color="inkMuted">
        Your key is stored only on this device. AI answers are educational, not financial advice.
      </Text>
    </View>
  );
}
