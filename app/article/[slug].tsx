import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RenderHtml from "react-native-render-html";

import { NewsCard } from "@/components/ui/NewsCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorView } from "@/components/ui/ErrorView";
import { ReactionsBar } from "@/components/article/ReactionsBar";
import { CommentsSection } from "@/components/article/CommentsSection";

import { getNewsBySlug, getRelatedNews } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import { getCategoryLabel, getSubCategoryLabel } from "@/constants/categories";
import { formatDate, timeAgo, formatCount } from "@/lib/utils";
import { Brand, Colors, FontSize, Radius, Spacing, Shadow, TeluguFont } from "@/constants/theme";
import type { News } from "@/types";

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const CONTENT_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
  const lang = useAppStore((s) => s.language);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [article, setArticle] = useState<News | null>(null);
  const [related, setRelated] = useState<News[]>([]);

  const fetchArticle = useCallback(async () => {
    if (!slug) return;
    try {
      setError(false);
      setLoading(true);
      const res = await getNewsBySlug(slug);
      const news = (res as any).news;
      setArticle(news);

      // Load related news
      if (news?._id) {
        try {
          const relRes = await getRelatedNews(news._id);
          setRelated((relRes as any).news ?? []);
        } catch {
          // ignore
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const handleShare = async () => {
    if (!article) return;
    const title = article.title[lang] || article.title.en;
    try {
      await Share.share({
        title,
        message: `${title}\n\nRead more on Tea Time Telugu`,
        url: `https://teatimetelugu.com/${article.category}/${article.slug}`,
      });
    } catch {
      // ignore
    }
  };

  if (loading) return <LoadingSpinner message="Loading article..." />;
  if (error || !article) return <ErrorView onRetry={fetchArticle} />;

  const title = article.title[lang] || article.title.en || article.title.te;
  const category = getCategoryLabel(article.category, lang);
  const subCategory = article.subCategory
    ? getSubCategoryLabel(article.category, article.subCategory, lang)
    : null;
  const htmlContent = article.description[lang]?.html || article.description.en?.html || "";
  const authorName = article.author?.fullName ?? "Tea Time Telugu";
  const publishedDate = article.publishedAt
    ? formatDate(article.publishedAt, lang)
    : "";
  const timeAgoStr = article.publishedAt
    ? timeAgo(article.publishedAt, lang)
    : "";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <Image
          source={{ uri: article.thumbnail }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />

        <View style={styles.articleBody}>
          {/* Category & Date */}
          <View style={styles.metaTopRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category}</Text>
            </View>
            {subCategory && (
              <View style={styles.subCategoryBadge}>
                <Text style={styles.subCategoryText}>{subCategory}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Author & Meta */}
          <View style={styles.authorRow}>
            {article.author?.avatar ? (
              <Image
                source={{ uri: article.author.avatar }}
                style={styles.authorAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.authorAvatar, styles.authorAvatarPlaceholder]}>
                <Ionicons name="person" size={14} color={Brand.primary} />
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.publishedInfo}>
                {publishedDate} · {timeAgoStr}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.statText}>{formatCount(article.reactionsCount)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.statText}>{article.commentsCount}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Article Content */}
          {htmlContent ? (
            <RenderHtml
              contentWidth={CONTENT_WIDTH}
              source={{ html: htmlContent }}
              tagsStyles={{
                body: {
                  color: Colors.light.text,
                  fontSize: 16,
                  lineHeight: 28,
                  fontFamily: TeluguFont,
                },
                p: {
                  marginTop: 0,
                  marginBottom: 12,
                },
                img: {
                  borderRadius: 8,
                },
                a: {
                  color: Brand.primary,
                  textDecorationLine: "none",
                },
                h1: { fontSize: 24, fontWeight: "700", fontFamily: TeluguFont, marginBottom: 8 },
                h2: { fontSize: 20, fontWeight: "700", fontFamily: TeluguFont, marginBottom: 8 },
                h3: { fontSize: 18, fontWeight: "700", fontFamily: TeluguFont, marginBottom: 8 },
                blockquote: {
                  borderLeftWidth: 3,
                  borderLeftColor: Brand.primary,
                  paddingLeft: 12,
                  fontStyle: "italic",
                  color: Colors.light.textSecondary,
                },
              }}
            />
          ) : (
            <Text style={styles.plainText}>
              {article.description[lang]?.text || article.description.en?.text || ""}
            </Text>
          )}

          {/* Tags */}
          {(article.tags[lang]?.length ?? 0) > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsSectionTitle}>
                {lang === "te" ? "ట్యాగ్‌లు" : "Tags"}
              </Text>
              <View style={styles.tagsRow}>
                {article.tags[lang]?.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reactions */}
          <View style={styles.divider} />
          <ReactionsBar
            targetId={article._id}
            targetModel="News"
            onLogin={() => router.push("/auth/login" as any)}
          />

          {/* Comments */}
          <View style={styles.divider} />
          <CommentsSection
            targetId={article._id}
            targetModel="News"
            onLogin={() => router.push("/auth/login" as any)}
          />
        </View>

        {/* Related News */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <SectionHeader
              title={lang === "te" ? "సంబంధిత వార్తలు" : "Related News"}
            />
            {related.slice(0, 5).map((item) => (
              <NewsCard
                key={item._id}
                item={item}
                lang={lang}
                variant="horizontal"
                onPress={() => router.push(`/article/${item.slug}` as any)}
              />
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.borderLight,
  },
  navRight: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  scrollContent: {
    // no extra padding needed
  },

  heroImage: {
    width: "100%",
    height: 240,
  },

  articleBody: {
    padding: Spacing.lg,
    backgroundColor: "#fff",
  },
  metaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: "#fff",
    textTransform: "uppercase",
  },
  subCategoryBadge: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  subCategoryText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    fontFamily: TeluguFont,
    color: Colors.light.text,
    lineHeight: 32,
    marginBottom: Spacing.lg,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  authorAvatarPlaceholder: {
    backgroundColor: Brand.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  authorInfo: {},
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Colors.light.text,
  },
  publishedInfo: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },

  statsRow: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.lg,
  },

  plainText: {
    fontSize: 16,
    lineHeight: 28,
    fontFamily: TeluguFont,
    color: Colors.light.text,
  },

  tagsSection: {
    marginTop: Spacing.xxl,
  },
  tagsSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },

  relatedSection: {
    marginTop: Spacing.lg,
  },
});
