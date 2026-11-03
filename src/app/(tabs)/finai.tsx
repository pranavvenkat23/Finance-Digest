/**
 * FinAI (tab) - a chat assistant for any money, tax, budget, or markets question,
 * grounded in the user's own tax picture. Powered by Groq (free). All answers are
 * educational, not financial advice.
 */

import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectAI } from '@/components/ai/ConnectAI';
import { Text } from '@/components/ui/Text';
import { groqChat, MissingKeyError, type ChatMessage } from '@/lib/ai/groq';
import { FINAI_SYSTEM, userTaxContext } from '@/lib/ai/prompts';
import { computeStateLocal } from '@/lib/stateTax';
import { federalIncomeTax } from '@/lib/tax';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';
import { useUserStore } from '@/store/userStore';

const GREETING =
  "Hi, I'm FinAI. Ask me anything about your taxes, the federal budget, stocks, or personal finance basics. I'll keep it plain and tie it to your numbers when it helps.";

const SUGGESTIONS = [
  'How is my federal tax calculated?',
  'What is the difference between income and payroll tax?',
  'How do capital gains taxes work?',
  'Where does most of my tax money go?',
];

export default function FinAIScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const input = useUserStore((s) => s.input);
  const apiKey = useAiStore((s) => s.apiKey);

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: GREETING }]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const userContext = useMemo(() => {
    if (!input) return '';
    const fed = federalIncomeTax(input.income, input.filingStatus);
    const sl = computeStateLocal(input.income, input.filingStatus, input.zip);
    return userTaxContext({ income: input.income, state: sl.state, federalIncomeTax: fed, stateLocalTotal: sl.total });
  }, [input]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setDraft('');
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const system: ChatMessage = {
        role: 'system',
        content: userContext ? `${FINAI_SYSTEM}\n\n${userContext}` : FINAI_SYSTEM,
      };
      // Send the system prompt plus the recent conversation (bounded).
      const history = nextMessages.filter((m) => m.role !== 'assistant' || m.content !== GREETING).slice(-10);
      const reply = await groqChat([system, ...history], { maxTokens: 600 });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      if (e instanceof MissingKeyError) setError('Add a free AI key below to start chatting.');
      else setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.appBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <View style={{ paddingTop: insets.top + Space.sm, paddingHorizontal: Space.xl, paddingBottom: Space.sm }}>
        <Text variant="title">FinAI</Text>
        <Text variant="caption" color="inkMuted">
          Your money questions, answered. Educational, not financial advice.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: Space.xl, paddingBottom: Space.lg, gap: Space.md }}
        keyboardShouldPersistTaps="handled">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}

        {loading && (
          <Bubble role="assistant" content="Thinking..." muted />
        )}
        {error && (
          <Text variant="caption" color="accent">
            {error}
          </Text>
        )}

        {/* Suggestions before the first user message */}
        {messages.length === 1 && apiKey && (
          <View style={{ gap: Space.sm, marginTop: Space.sm }}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                accessibilityRole="button"
                style={{ padding: Space.md, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface }}>
                <Text variant="body" color="inkSecondary">
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {!apiKey && (
          <View style={{ marginTop: Space.sm }}>
            <ConnectAI />
          </View>
        )}
      </ScrollView>

      {/* Composer */}
      {apiKey && (
        <View
          style={{
            flexDirection: 'row',
            gap: Space.sm,
            paddingHorizontal: Space.xl,
            paddingTop: Space.sm,
            paddingBottom: insets.bottom + Space.sm,
            borderTopWidth: 1,
            borderTopColor: theme.colors.line,
            backgroundColor: theme.colors.surface,
          }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask FinAI anything about your money..."
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
              fontSize: 16,
            }}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
            accessibilityLabel="Message FinAI"
          />
          <Pressable
            onPress={() => send(draft)}
            disabled={loading || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={{ paddingHorizontal: Space.lg, justifyContent: 'center', borderRadius: Radius.md, backgroundColor: theme.colors.accent, opacity: loading || !draft.trim() ? 0.5 : 1 }}>
            <Text variant="bodyStrong" color="onAccent">
              Send
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Bubble({ role, content, muted }: { role: ChatMessage['role']; content: string; muted?: boolean }) {
  const theme = useTheme();
  const isUser = role === 'user';
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        padding: Space.md,
        borderRadius: Radius.lg,
        backgroundColor: isUser ? theme.colors.accent : theme.colors.surface,
        borderWidth: isUser ? 0 : 1,
        borderColor: theme.colors.line,
      }}>
      <Text variant="body" color={isUser ? 'onAccent' : muted ? 'inkMuted' : 'ink'}>
        {content}
      </Text>
    </View>
  );
}
