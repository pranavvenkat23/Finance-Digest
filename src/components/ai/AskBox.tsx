/**
 * Reusable single-question AI box: a text input plus the AI's concise answer.
 * Used under news articles and stocks. Falls back to the ConnectAI setup if no
 * key is configured. All answers are framed as educational, not advice.
 */

import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ConnectAI } from '@/components/ai/ConnectAI';
import { Text } from '@/components/ui/Text';
import { groqChat, MissingKeyError, type ChatMessage } from '@/lib/ai/groq';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';

export function AskBox({
  systemPrompt,
  context,
  placeholder = 'Ask how this affects you...',
  suggestions = [],
}: {
  systemPrompt: string;
  context?: string;
  placeholder?: string;
  suggestions?: string[];
}) {
  const theme = useTheme();
  const apiKey = useAiStore((s) => s.apiKey);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const ask = async (q: string) => {
    const query = q.trim();
    if (!query || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: context ? `${systemPrompt}\n\n${context}` : systemPrompt },
        { role: 'user', content: query },
      ];
      const reply = await groqChat(messages, { fast: true, maxTokens: 500 });
      setAnswer(reply);
    } catch (e) {
      if (e instanceof MissingKeyError) setNeedsKey(true);
      else setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (needsKey && !apiKey) {
    return <ConnectAI compact />;
  }

  return (
    <View style={{ gap: Space.sm }}>
      <View style={{ flexDirection: 'row', gap: Space.sm, alignItems: 'center' }}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.inkMuted}
          style={{
            flex: 1,
            backgroundColor: theme.colors.appBg,
            borderColor: theme.colors.line,
            borderWidth: 1,
            borderRadius: Radius.md,
            paddingHorizontal: Space.lg,
            paddingVertical: Space.md,
            color: theme.colors.ink,
            fontSize: 15,
          }}
          onSubmitEditing={() => ask(question)}
          returnKeyType="send"
          accessibilityLabel="Ask the AI a question"
        />
        <Pressable
          onPress={() => ask(question)}
          disabled={loading || !question.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send question"
          style={{
            paddingHorizontal: Space.lg,
            paddingVertical: Space.md,
            borderRadius: Radius.md,
            backgroundColor: theme.colors.accent,
            opacity: loading || !question.trim() ? 0.5 : 1,
          }}>
          <Text variant="bodyStrong" color="onAccent">
            {loading ? '...' : 'Ask'}
          </Text>
        </Pressable>
      </View>

      {suggestions.length > 0 && !answer && !loading && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setQuestion(s);
                ask(s);
              }}
              accessibilityRole="button"
              style={{
                paddingHorizontal: Space.md,
                paddingVertical: Space.sm,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: theme.colors.line,
                backgroundColor: theme.colors.surface,
              }}>
              <Text variant="caption" color="inkSecondary">
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading && (
        <Text variant="caption" color="inkMuted">
          FinAI is thinking...
        </Text>
      )}
      {error && (
        <Text variant="caption" color="accent">
          {error}
        </Text>
      )}
      {answer && (
        <View
          style={{
            padding: Space.md,
            borderRadius: Radius.md,
            backgroundColor: theme.colors.accentSoft,
          }}>
          <Text variant="body" color="ink">
            {answer}
          </Text>
          <Text variant="caption" color="inkMuted" style={{ marginTop: Space.sm }}>
            AI generated. Educational, not financial advice.
          </Text>
        </View>
      )}
    </View>
  );
}
