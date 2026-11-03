/**
 * One news item. Tapping expands it to show the AI "what this means for you"
 * explanation (generated on demand to respect rate limits) plus a follow-up
 * AskBox. All AI text is labeled educational, not advice.
 */

import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AskBox } from '@/components/ai/AskBox';
import { ConnectAI } from '@/components/ai/ConnectAI';
import { Text } from '@/components/ui/Text';
import { groqChat, MissingKeyError } from '@/lib/ai/groq';
import { NEWS_SYSTEM } from '@/lib/ai/prompts';
import type { NewsItem } from '@/lib/api/news';
import { timeAgo } from '@/lib/format';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';

export function NewsCard({
  item,
  nowMs,
  userContext,
}: {
  item: NewsItem;
  nowMs: number;
  userContext: string;
}) {
  const theme = useTheme();
  const apiKey = useAiStore((s) => s.apiKey);
  const [expanded, setExpanded] = useState(false);
  const [impact, setImpact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const loadImpact = async () => {
    if (impact || loading) return;
    setLoading(true);
    setError(null);
    try {
      const reply = await groqChat(
        [
          { role: 'system', content: userContext ? `${NEWS_SYSTEM}\n\n${userContext}` : NEWS_SYSTEM },
          {
            role: 'user',
            content: `Headline: ${item.title}\nSummary: ${item.summary || '(no summary)'}\nExplain what this means and how it could affect everyday finances.`,
          },
        ],
        { fast: true, maxTokens: 320 },
      );
      setImpact(reply);
    } catch (e) {
      if (e instanceof MissingKeyError) setNeedsKey(true);
      else setError(e instanceof Error ? e.message : 'Could not load the explanation.');
    } finally {
      setLoading(false);
    }
  };

  const onToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && apiKey) void loadImpact();
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.line,
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Space.lg,
        marginBottom: Space.md,
        gap: Space.sm,
      }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`${item.title}. Tap for the financial impact.`}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" color="accent">
            {item.source}
          </Text>
          <Text variant="caption" color="inkMuted">
            {timeAgo(item.publishedAt, nowMs)}
          </Text>
        </View>
        <Text variant="bodyStrong" style={{ marginTop: 4 }}>
          {item.title}
        </Text>
        {!!item.summary && !expanded && (
          <Text variant="caption" color="inkSecondary" numberOfLines={2} style={{ marginTop: 4 }}>
            {item.summary}
          </Text>
        )}
      </Pressable>

      {expanded && (
        <View style={{ gap: Space.sm }}>
          {!!item.summary && (
            <Text variant="body" color="inkSecondary">
              {item.summary}
            </Text>
          )}

          {needsKey && !apiKey ? (
            <ConnectAI compact />
          ) : (
            <View
              style={{
                padding: Space.md,
                borderRadius: Radius.md,
                backgroundColor: theme.colors.accentSoft,
                gap: 4,
              }}>
              <Text variant="label" color="accent">
                What this means for you
              </Text>
              {loading && (
                <Text variant="caption" color="inkMuted">
                  FinAI is reading the story...
                </Text>
              )}
              {error && (
                <Text variant="caption" color="accent">
                  {error}
                </Text>
              )}
              {impact && <Text variant="body">{impact}</Text>}
              {impact && (
                <Text variant="caption" color="inkMuted" style={{ marginTop: 4 }}>
                  AI generated. Educational, not financial advice.
                </Text>
              )}
            </View>
          )}

          {apiKey && impact && (
            <AskBox
              systemPrompt={NEWS_SYSTEM}
              context={`${userContext}\nThe user is reading this story: "${item.title}".`}
              placeholder="Ask a follow-up about this story..."
              suggestions={['How does this affect my taxes?', 'Should I be worried?']}
            />
          )}

          <Pressable onPress={() => openBrowserAsync(item.link)} accessibilityRole="link" hitSlop={6}>
            <Text variant="caption" color="accent">
              Read the full article ↗
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
