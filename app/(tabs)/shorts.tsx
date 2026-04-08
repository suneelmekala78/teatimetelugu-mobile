import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  ScrollView,
  Share,
  ActivityIndicator,
  Linking,
  type ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getShortNews, toggleReaction, getReactionSummary, getMyReaction } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import { useUserStore } from "@/store/useUserStore";
import { getCategoryLabel } from "@/constants/categories";
import { timeAgo, formatCount } from "@/lib/utils";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorView } from "@/components/ui/ErrorView";
import { CommentsBottomSheet } from "@/components/ui/CommentsBottomSheet";
import type { News } from "@/types";

const TELUGU_FONT = "Mallanna";

const REACTION_EMOJIS = [
  { type: "happy", emoji: "😊" },
  { type: "normal", emoji: "😐" },
  { type: "amused", emoji: "😏" },
  { type: "funny", emoji: "😂" },
  { type: "angry", emoji: "😡" },
  { type: "sad", emoji: "😢" },
] as const;

export default function ShortsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const lang = useAppStore((s) => s.language);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const listRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [commentsItem, setCommentsItem] = useState<News | null>(null);

  // Reactions state
  const [reactionPopupId, setReactionPopupId] = useState<string | null>(null);
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  const PAGE_SIZE = 15;
  // No bottom bar on shorts, only header + safe area top
  const HEADER_HEIGHT = 48;
  const CARD_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - insets.top;
  const isSmallScreen = SCREEN_HEIGHT < 700;
  const IMAGE_HEIGHT = isSmallScreen ? CARD_HEIGHT * 0.30 : CARD_HEIGHT * 0.38;
  const ACTION_BAR_HEIGHT = 48;

  const fetchNews = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setError(false);
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getShortNews({ page: pageNum, limit: PAGE_SIZE });
      const data = res as any;
      const items: News[] = data.news ?? [];
      const pagination = data.pagination;

      if (pagination) {
        setTotalCount(pagination.total);
        setHasMore(pageNum < pagination.pages);
      }

      if (items.length === 0) {
        setHasMore(false);
      } else {
        setNews(pageNum === 1 ? items : (prev) => [...prev, ...items]);
      }
    } catch {
      if (pageNum === 1) setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(1);
  }, [fetchNews]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage);
  }, [page, loadingMore, hasMore, fetchNews]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
      setReactionPopupId(null);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handleShare = async (item: News) => {
    const title = item.title[lang] || item.title.en;
    try {
      await Share.share({
        title,
        message: `${title}\n\nhttps://teatimetelugu.com/${item.category}/${item.slug}`,
      });
    } catch {
      // ignore
    }
  };

  const handleWhatsAppShare = async (item: News) => {
    const title = item.title[lang] || item.title.en;
    const url = `https://teatimetelugu.com/${item.category}/${item.slug}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(`${title}\n\n${url}`)}`;
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        handleShare(item);
      }
    } catch {
      handleShare(item);
    }
  };

  // Fetch user's reaction for current card
  const fetchMyReaction = useCallback(async (itemId: string) => {
    if (!isAuthenticated || myReactions[itemId] !== undefined) return;
    try {
      const [summaryRes, myRes] = await Promise.all([
        getReactionSummary("News", itemId),
        getMyReaction("News", itemId),
      ]);
      const total = Object.values((summaryRes as any).summary ?? {}).reduce((a: number, b: any) => a + (b as number), 0);
      setReactionCounts((prev) => ({ ...prev, [itemId]: total as number }));
      setMyReactions((prev) => ({ ...prev, [itemId]: (myRes as any).data?.reaction?.type ?? null }));
    } catch {
      setMyReactions((prev) => ({ ...prev, [itemId]: null }));
    }
  }, [isAuthenticated, myReactions]);

  // Fetch reaction for current visible card
  useEffect(() => {
    if (news[currentIndex]) {
      fetchMyReaction(news[currentIndex]._id);
    }
  }, [currentIndex, news]);

  const handleReaction = async (itemId: string, type: string) => {
    if (!isAuthenticated) {
      router.push("/auth/login" as any);
      return;
    }
    const wasSelected = myReactions[itemId] === type;
    const prevType = myReactions[itemId];

    // Optimistic update
    setMyReactions((prev) => ({ ...prev, [itemId]: wasSelected ? null : type }));
    setReactionCounts((prev) => {
      const current = prev[itemId] ?? 0;
      if (wasSelected) return { ...prev, [itemId]: Math.max(0, current - 1) };
      if (prevType) return { ...prev, [itemId]: current }; // changing type, count stays
      return { ...prev, [itemId]: current + 1 };
    });
    setReactionPopupId(null);

    try {
      await toggleReaction({ target: itemId, targetModel: "News", type });
    } catch {
      // Revert
      setMyReactions((prev) => ({ ...prev, [itemId]: prevType ?? null }));
      setReactionCounts((prev) => {
        const current = prev[itemId] ?? 0;
        if (wasSelected) return { ...prev, [itemId]: current + 1 };
        if (prevType) return prev;
        return { ...prev, [itemId]: Math.max(0, current - 1) };
      });
    }
  };

  if (loading) return <LoadingSpinner message={lang === "te" ? "లోడ్ అవుతోంది..." : "Loading short news..."} />;
  if (error || news.length === 0) return <ErrorView onRetry={() => fetchNews(1)} />;

  const renderCard = ({ item, index }: { item: News; index: number }) => {
    const title = item.title[lang] || item.title.en || item.title.te;
    const shortText = item.shortNews?.[lang] || item.shortNews?.en || item.shortNews?.te || "";
    const descText = item.description?.[lang]?.text || item.description?.en?.text || item.description?.te?.text || "";
    const summaryText = shortText || (descText.length > 400 ? descText.slice(0, 400) : descText);
    const isTruncated = !shortText && descText.length > 400;
    const category = getCategoryLabel(item.category, lang);
    const time = item.publishedAt ? timeAgo(item.publishedAt, lang) : "";

    const contentHeight = CARD_HEIGHT - IMAGE_HEIGHT - ACTION_BAR_HEIGHT;

    return (
      <View style={[styles.card, { height: CARD_HEIGHT }]}>
        {/* Image Section */}
        <View style={[styles.imageSection, { height: IMAGE_HEIGHT }]}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
          />
          {/* Category badge on image */}
          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeText}>{category}</Text>
          </View>
          {/* Page indicator */}
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>
              {index + 1} / {totalCount || news.length}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <ScrollView
          style={[styles.contentSection, { height: contentHeight }]}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Headline */}
          <Text style={[styles.headline, lang === "te" && { fontFamily: TELUGU_FONT }]} numberOfLines={2}>
            {title}
          </Text>

          {/* Summary text (short news or truncated description) */}
          {summaryText !== "" && (
            <Text style={[styles.shortNewsText, lang === "te" && { fontFamily: TELUGU_FONT }]}>
              {summaryText}
              {isTruncated && (
                <Text
                  style={styles.readMoreInline}
                  onPress={() => router.push(`/article/${item.slug}` as any)}
                >
                  ...{lang === "te" ? "మరిన్ని చదవండి" : "read more"}
                </Text>
              )}
            </Text>
          )}

          {/* Meta row – only time */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Ionicons name="time-outline" size={13} color={Colors.light.textMuted} />
              <Text style={styles.metaText}>{time}</Text>
            </View>
          </View>

          {/* Read full article link */}
          <TouchableOpacity
            style={styles.readMoreBtn}
            onPress={() => router.push(`/article/${item.slug}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.readMoreText}>
              {lang === "te" ? "పూర్తి వార్త చదవండి" : "Read Full Article"}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Brand.primary} />
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.reactionWrapper}>
            {reactionPopupId === item._id && (
              <View style={styles.reactionPopup}>
                {REACTION_EMOJIS.map(({ type, emoji }) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.reactionEmojiBtn,
                      myReactions[item._id] === type && styles.reactionEmojiBtnActive,
                    ]}
                    onPress={() => handleReaction(item._id, type)}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => setReactionPopupId(
                reactionPopupId === item._id ? null : item._id
              )}
            >
              {myReactions[item._id] ? (
                <Text style={{ fontSize: 20 }}>
                  {REACTION_EMOJIS.find((r) => r.type === myReactions[item._id])?.emoji ?? "😊"}
                </Text>
              ) : (
                <Ionicons name="heart-outline" size={22} color={Colors.light.text} />
              )}
              {(reactionCounts[item._id] ?? item.reactionsCount) > 0 && (
                <Text style={styles.actionCount}>
                  {formatCount(reactionCounts[item._id] ?? item.reactionsCount)}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionItem} onPress={() => setCommentsItem(item)}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.light.text} />
            {item.commentsCount > 0 && (
              <Text style={styles.actionCount}>{item.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => handleWhatsAppShare(item)}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => handleShare(item)}>
            <Ionicons name="share-social-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => Linking.openURL(`https://teatimetelugu.com/${item.category}/${item.slug}`)}>
            <Ionicons name="globe-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Ionicons name="flash" size={20} color={Brand.primary} />
        <Text style={styles.headerTitle}>
          {lang === "te" ? "షార్ట్ న్యూస్" : "Short News"}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={news}
        keyExtractor={(item) => item._id}
        renderItem={renderCard}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={CARD_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, i) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * i,
          index: i,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={2}
        ListFooterComponent={
          loadingMore ? (
            <View style={[styles.footer, { height: CARD_HEIGHT }]}>
              <ActivityIndicator size="large" color={Brand.primary} />
              <Text style={styles.footerText}>
                {lang === "te" ? "మరిన్ని లోడ్ అవుతోంది..." : "Loading more..."}
              </Text>
            </View>
          ) : null
        }
      />

      <CommentsBottomSheet
        visible={!!commentsItem}
        onClose={() => setCommentsItem(null)}
        targetId={commentsItem?._id ?? ""}
        targetModel="News"
        onLogin={() => router.push("/auth/login" as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    height: 48,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    marginRight: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.light.text,
  },

  // Card
  card: {
    backgroundColor: "#fff",
  },

  // Image section
  imageSection: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  imageBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },

  // Content section
  contentSection: {
    paddingHorizontal: Spacing.lg,
  },
  contentInner: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headline: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  shortNewsText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  readMoreInline: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Brand.primary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: Spacing.sm,
  },
  readMoreText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Brand.primary,
  },

  // Action bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    backgroundColor: "#fff",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 44,
    justifyContent: "center",
  },
  actionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  // Reaction popup
  reactionWrapper: {
    position: "relative",
  },
  reactionPopup: {
    position: "absolute",
    bottom: 48,
    left: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 2,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  reactionEmojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionEmojiBtnActive: {
    backgroundColor: Brand.primary + "20",
  },
  reactionEmoji: {
    fontSize: 22,
  },

  // Page indicator
  pageIndicator: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pageText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  // Footer
  footer: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
});
