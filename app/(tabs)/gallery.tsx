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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GalleryCard } from "@/components/ui/GalleryCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyView } from "@/components/ui/ErrorView";

import { getPublishedGallery } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import { CATEGORIES } from "@/constants/categories";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { Gallery } from "@/types";

const GALLERY_SUB_CATS = Object.entries(CATEGORIES.gallery.subCategories);

export default function GalleryTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useAppStore((s) => s.language);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchGalleries = useCallback(
    async (p = 1, filter: string | null = activeFilter) => {
      try {
        setError(false);
        const params: Record<string, string | number> = { page: p, limit: 15 };
        if (filter) params.subCategory = filter;

        const res = await getPublishedGallery(params);
        const items = (res as any).galleries ?? [];

        if (p === 1) {
          setGalleries(items);
        } else {
          setGalleries((prev) => [...prev, ...items]);
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
    [activeFilter]
  );

  useEffect(() => {
    setLoading(true);
    fetchGalleries(1, activeFilter);
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGalleries(1, activeFilter);
  }, [activeFilter]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchGalleries(page + 1, activeFilter);
    }
  }, [hasMore, loading, page, activeFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === "te" ? "గ్యాలరీ" : "Gallery"}
        </Text>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.chip, !activeFilter && styles.chipActive]}
          onPress={() => setActiveFilter(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, !activeFilter && styles.chipTextActive]}>
            {lang === "te" ? "అన్నీ" : "All"}
          </Text>
        </TouchableOpacity>
        {GALLERY_SUB_CATS.map(([key, val]) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, activeFilter === key && styles.chipActive]}
            onPress={() => setActiveFilter(key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.chipText, activeFilter === key && styles.chipTextActive]}
            >
              {(val as any)[lang]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {loading && page === 1 ? (
          <LoadingSpinner />
        ) : error && galleries.length === 0 ? (
          <ErrorView onRetry={() => fetchGalleries(1)} />
        ) : galleries.length === 0 ? (
          <EmptyView
            title={lang === "te" ? "గ్యాలరీలు లేవు" : "No galleries found"}
            icon="images-outline"
          />
        ) : (
          <FlatList
            data={galleries}
            keyExtractor={(item) => item._id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 16 }}
            columnWrapperStyle={{ gap: Spacing.md }}
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
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <GalleryCard
                  item={item}
                  lang={lang}
                  variant="compact"
                  onPress={() => router.push(`/gallery/${item.slug}` as any)}
                />
              </View>
            )}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
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
