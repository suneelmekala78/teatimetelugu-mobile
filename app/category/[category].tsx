import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NewsCard } from "@/components/ui/NewsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyView } from "@/components/ui/ErrorView";

import { getPublishedNews } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import {
  getCategoryLabel,
  CATEGORIES,
  type CategoryKey,
} from "@/constants/categories";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { News } from "@/types";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useAppStore((s) => s.language);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);

  const categoryData = CATEGORIES[category as CategoryKey];
  const subCategories = categoryData
    ? Object.entries(categoryData.subCategories)
    : [];

  const fetchNews = useCallback(
    async (p = 1, sub: string | null = activeSubCat) => {
      if (!category) return;
      try {
        setError(false);
        const params: Record<string, string | number> = {
          page: p,
          limit: 15,
          category: category,
        };
        if (sub) params.subCategory = sub;

        const res = await getPublishedNews(params);
        const items = (res as any).news ?? [];

        if (p === 1) {
          setNews(items);
        } else {
          setNews((prev) => [...prev, ...items]);
        }
        setHasMore(items.length === 15);
        setPage(p);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, activeSubCat]
  );

  useEffect(() => {
    setLoading(true);
    fetchNews(1, activeSubCat);
  }, [category, activeSubCat]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNews(1, activeSubCat);
  }, [activeSubCat, category]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchNews(page + 1, activeSubCat);
    }
  }, [hasMore, loading, page, activeSubCat]);

  const title = getCategoryLabel(category ?? "", lang);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Sub-category Chips */}
      {subCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.chip, !activeSubCat && styles.chipActive]}
            onPress={() => {
              setActiveSubCat(null);
              setLoading(true);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.chipText, !activeSubCat && styles.chipTextActive]}
            >
              {lang === "te" ? "అన్నీ" : "All"}
            </Text>
          </TouchableOpacity>
          {subCategories.map(([key, val]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                activeSubCat === key && styles.chipActive,
              ]}
              onPress={() => {
                setActiveSubCat(key);
                setLoading(true);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  activeSubCat === key && styles.chipTextActive,
                ]}
              >
                {(val as any)[lang]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        {loading && page === 1 ? (
          <LoadingSpinner />
        ) : error && news.length === 0 ? (
          <ErrorView onRetry={() => fetchNews(1)} />
        ) : news.length === 0 ? (
          <EmptyView
            title={lang === "te" ? "వార్తలు లేవు" : "No news found"}
            message={
              lang === "te"
                ? "ఈ వర్గంలో అందుబాటులో లేదు"
                : "No articles available in this category"
            }
          />
        ) : (
          <FlatList
            data={news}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: Spacing.md,
              paddingBottom: insets.bottom + 16,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Brand.primary]}
                tintColor={Brand.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
                <NewsCard
                  item={item}
                  lang={lang}
                  variant="horizontal"
                  onPress={() =>
                    router.push(`/article/${item.slug}` as any)
                  }
                />
              )}
            ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: "#fff",
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.borderLight,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.light.text,
    textAlign: "center",
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    flexGrow: 0,
  },
  filterRow: {
    flexGrow: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.background,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  chipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
    elevation: 2,
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
