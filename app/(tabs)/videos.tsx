import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VideoCard } from "@/components/ui/VideoCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyView } from "@/components/ui/ErrorView";

import { getLatestVideos, getPublishedVideos } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import { CATEGORIES } from "@/constants/categories";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { Video } from "@/types";

const VIDEO_SUB_CATS = Object.entries(CATEGORIES.videos.subCategories);

export default function VideosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useAppStore((s) => s.language);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchVideos = useCallback(
    async (p = 1, filter: string | null = activeFilter) => {
      try {
        setError(false);
        const params: Record<string, string | number> = { page: p, limit: 15 };
        if (filter) params.subCategory = filter;

        const res = await getPublishedVideos(params);
        const newVideos = (res as any).videos ?? [];

        if (p === 1) {
          setVideos(newVideos);
        } else {
          setVideos((prev) => [...prev, ...newVideos]);
        }
        setHasMore(newVideos.length === 15);
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
    fetchVideos(1, activeFilter);
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideos(1, activeFilter);
  }, [activeFilter]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchVideos(page + 1, activeFilter);
    }
  }, [hasMore, loading, page, activeFilter]);

  const selectFilter = (key: string | null) => {
    if (key === activeFilter) return;
    setActiveFilter(key);
    setLoading(true);
    setPage(1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === "te" ? "వీడియోలు" : "Videos"}
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
          onPress={() => selectFilter(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, !activeFilter && styles.chipTextActive]}>
            {lang === "te" ? "అన్నీ" : "All"}
          </Text>
        </TouchableOpacity>
        {VIDEO_SUB_CATS.map(([key, val]) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, activeFilter === key && styles.chipActive]}
            onPress={() => selectFilter(key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.chipText, activeFilter === key && styles.chipTextActive]}
            >
              {val[lang]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {loading && page === 1 ? (
          <LoadingSpinner />
        ) : error && videos.length === 0 ? (
          <ErrorView onRetry={() => fetchVideos(1)} />
        ) : videos.length === 0 ? (
          <EmptyView
            title={lang === "te" ? "వీడియోలు లేవు" : "No videos found"}
            icon="videocam-outline"
          />
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: insets.bottom + 16 }}
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
              <VideoCard
                item={item}
                lang={lang}
                variant="horizontal"
                onPress={() => router.push(`/video/${item.slug}` as any)}
              />
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
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.light.text,
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
