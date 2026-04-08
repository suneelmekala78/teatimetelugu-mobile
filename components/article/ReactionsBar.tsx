import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import { getReactionSummary, toggleReaction, getMyReaction } from "@/lib/requests";
import { useUserStore } from "@/store/useUserStore";
import { useAppStore } from "@/store/useAppStore";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { ReactionSummary } from "@/types";

const REACTION_CONFIG = [
  { type: "happy", emoji: "😊", label: { en: "Happy", te: "సంతోషం" } },
  { type: "normal", emoji: "😐", label: { en: "Normal", te: "సాధారణం" } },
  { type: "amused", emoji: "😏", label: { en: "Amused", te: "వినోదం" } },
  { type: "funny", emoji: "😂", label: { en: "Funny", te: "నవ్వు" } },
  { type: "angry", emoji: "😡", label: { en: "Angry", te: "కోపం" } },
  { type: "sad", emoji: "😢", label: { en: "Sad", te: "బాధ" } },
] as const;

interface Props {
  targetId: string;
  targetModel: "News" | "Gallery";
  onLogin?: () => void;
}

export function ReactionsBar({ targetId, targetModel, onLogin }: Props) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const lang = useAppStore((s) => s.language);

  const [summary, setSummary] = useState<ReactionSummary>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getReactionSummary(targetModel, targetId);
      setSummary((res as any).summary ?? {});
    } catch {
      // ignore
    }

    if (isAuthenticated) {
      try {
        const res = await getMyReaction(targetModel, targetId);
        setMyReaction((res as any).data?.reaction?.type ?? null);
      } catch {
        // ignore
      }
    }
  }, [targetId, targetModel, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReaction = async (type: string) => {
    if (!isAuthenticated) {
      if (onLogin) onLogin();
      else
        Alert.alert(
          lang === "te" ? "లాగిన్ అవసరం" : "Login Required",
          lang === "te"
            ? "రియాక్ట్ చేయడానికి దయచేసి లాగిన్ చేయండి"
            : "Please login to react"
        );
      return;
    }

    if (loading) return;
    setLoading(true);

    const wasSelected = myReaction === type;

    // Optimistic update
    setSummary((prev) => {
      const next = { ...prev };
      if (wasSelected) {
        next[type] = Math.max(0, (next[type] ?? 0) - 1);
      } else {
        if (myReaction) {
          next[myReaction] = Math.max(0, (next[myReaction] ?? 0) - 1);
        }
        next[type] = (next[type] ?? 0) + 1;
      }
      return next;
    });
    setMyReaction(wasSelected ? null : type);

    try {
      await toggleReaction({
        target: targetId,
        targetModel,
        type,
      });
    } catch {
      // Revert on error
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {lang === "te" ? "మీ అభిప్రాయం" : "Your Reaction"}
        {totalReactions > 0 && (
          <Text style={styles.totalCount}> · {totalReactions}</Text>
        )}
      </Text>
      <View style={styles.reactionsRow}>
        {REACTION_CONFIG.map(({ type, emoji, label }) => {
          const count = summary[type] ?? 0;
          const isSelected = myReaction === type;

          return (
            <TouchableOpacity
              key={type}
              style={[styles.reactionBtn, isSelected && styles.reactionBtnActive]}
              onPress={() => handleReaction(type)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              {count > 0 && (
                <Text
                  style={[
                    styles.reactionCount,
                    isSelected && styles.reactionCountActive,
                  ]}
                >
                  {count}
                </Text>
              )}
              <Text
                style={[
                  styles.reactionLabel,
                  isSelected && styles.reactionLabelActive,
                ]}
              >
                {label[lang]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  totalCount: {
    fontWeight: "400",
    color: Colors.light.textMuted,
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  reactionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.borderLight,
    gap: 2,
  },
  reactionBtnActive: {
    backgroundColor: Brand.primary + "18",
    borderWidth: 1.5,
    borderColor: Brand.primary,
  },
  emoji: {
    fontSize: 24,
  },
  reactionCount: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  reactionCountActive: {
    color: Brand.primary,
  },
  reactionLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  reactionLabelActive: {
    color: Brand.primary,
  },
});
