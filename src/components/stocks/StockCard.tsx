/**
 * One quote row. Tapping expands an AI explainer (what it is, what a move like
 * this means, tax angles) plus a follow-up AskBox. Optional remove button for
 * watchlist items. AI text is labeled educational, not advice.
 */

import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AskBox } from '@/components/ai/AskBox';
import { ConnectAI } from '@/components/ai/ConnectAI';
import { Text } from '@/components/ui/Text';
import { groqChat, MissingKeyError } from '@/lib/ai/groq';
import { STOCKS_SYSTEM } from '@/lib/ai/prompts';
import type { Quote } from '@/lib/api/stocks';
import { formatSignedPercent } from '@/lib/format';
import { Radius, Space, useTheme } from '@/lib/theme';
import { useAiStore } from '@/store/aiStore';

export function StockCard({
  quote,
  userContext,
  onRemove,
}: {
  quote: Quote;
  userContext: string;
  onRemove?: () => void;
}) {
  const theme = useTheme();
  const apiKey = useAiStore((s) => s.apiKey);
  const [expanded, setExpanded] = useState(false);
  const [explainer, setExplainer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const up = quote.change >= 0;
  const moveColor = up ? theme.colors.positive : theme.colors.accent;

  const loadExplainer = async () => {
    if (explainer || loading) return;
    setLoading(true);
    setError(null);
    try {
      const reply = await groqChat(
        [
          { role: 'system', content: userContext ? `${STOCKS_SYSTEM}\n\n${userContext}` : STOCKS_SYSTEM },
          {
            role: 'user',
            content: `Ticker ${quote.symbol} (${quote.name}) is at ${quote.price.toFixed(2)} ${quote.currency}, ${formatSignedPercent(quote.changePct)} today. Briefly explain what it is and what a move like this could mean for an everyday investor, including any tax angle.`,
          },
        ],
        { fast: true, maxTokens: 320 },
      );
      setExplainer(reply);
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
    if (next && apiKey) void loadExplainer();
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
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`${quote.name}, ${formatSignedPercent(quote.changePct)} today. Tap to explain.`}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: Space.sm }}>
            <Text variant="bodyStrong">{quote.symbol}</Text>
            <Text variant="caption" color="inkMuted" numberOfLines={1}>
              {quote.name}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="bodyStrong" mono>
              {quote.price.toFixed(2)}
            </Text>
            <Text variant="caption" mono style={{ color: moveColor }}>
              {up ? '▲' : '▼'} {formatSignedPercent(quote.changePct)}
            </Text>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View style={{ gap: Space.sm }}>
          {needsKey && !apiKey ? (
            <ConnectAI compact />
          ) : (
            <View style={{ padding: Space.md, borderRadius: Radius.md, backgroundColor: theme.colors.accentSoft, gap: 4 }}>
              <Text variant="label" color="accent">
                FinAI explains
              </Text>
              {loading && (
                <Text variant="caption" color="inkMuted">
                  Looking at {quote.symbol}...
                </Text>
              )}
              {error && (
                <Text variant="caption" color="accent">
                  {error}
                </Text>
              )}
              {explainer && <Text variant="body">{explainer}</Text>}
              {explainer && (
                <Text variant="caption" color="inkMuted" style={{ marginTop: 4 }}>
                  AI generated. Educational, not financial advice.
                </Text>
              )}
            </View>
          )}

          {apiKey && explainer && (
            <AskBox
              systemPrompt={STOCKS_SYSTEM}
              context={`${userContext}\nThe user is looking at ${quote.symbol} (${quote.name}).`}
              placeholder={`Ask about ${quote.symbol}...`}
              suggestions={['How are gains taxed?', 'Why might it move like this?']}
            />
          )}

          {onRemove && (
            <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${quote.symbol} from watchlist`} hitSlop={6}>
              <Text variant="caption" color="inkMuted">
                Remove from watchlist
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
