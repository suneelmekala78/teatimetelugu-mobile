import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { searchContent } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import { Brand, Colors, FontSize, Radius, Spacing, Shadow } from "@/constants/theme";
import { timeAgo } from "@/lib/utils";
import type { SearchHit, SearchResult } from "@/types";

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useAppStore((s) => s.language);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [flatHits, setFlatHits] = useState<(SearchHit & { _index: string })[]>([]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);

    try {
      const res = await searchContent({ q: q.trim(), limit: 30 });
      const data = res as any;

      if (data.results) {
        const hits = data.results.flatMap((r: SearchResult) =>
          r.hits.map((h: SearchHit) => ({ ...h, _index: r.index }))
        );
        setFlatHits(hits);
      } else if (data.hits) {
        setFlatHits(data.hits.map((h: SearchHit) => ({ ...h, _index: "news" })));
      } else {
        setFlatHits([]);
      }
    } catch {
      setFlatHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getHitTitle = (hit: SearchHit) => {
    if (lang === "te") {
      return hit.title_te || hit.name_te || hit.title_en || hit.name_en || "";
    }
    return hit.title_en || hit.name_en || hit.title_te || hit.name_te || "";
  };

  const navigateToHit = (hit: SearchHit & { _index: string }) => {
    if (hit._index === "gallery" || hit._index === "galleries") {
      router.push(`/gallery/${hit.slug}` as any);
    } else if (hit._index === "videos") {
      router.push(`/video/${hit.slug}` as any);
    } else {
      router.push(`/article/${hit.slug}` as any);
    }
  };

  const getIndexLabel = (index: string) => {
    if (index === "gallery" || index === "galleries") return "Gallery";
    if (index === "videos") return "Video";
    return "News";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with search bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.light.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={lang === "te" ? "వార్తలు వెతకండి..." : "Search news..."}
            placeholderTextColor={Colors.light.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch(query)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setFlatHits([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <LoadingSpinner message={lang === "te" ? "వెతుకుతోంది..." : "Searching..."} />
      ) : searched && flatHits.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={Colors.light.border} />
          <Text style={styles.emptyTitle}>
            {lang === "te" ? "ఫలితాలు కనుగొనబడలేదు" : "No results found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {lang === "te" ? "వేరే పదం ప్రయత్నించండి" : "Try a different search term"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatHits}
          keyExtractor={(item) => item.id + item._index}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => navigateToHit(item)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.resultImage}
                contentFit="cover"
              />
              <View style={styles.resultContent}>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>{getIndexLabel(item._index)}</Text>
                </View>
                <Text style={styles.resultTitle} numberOfLines={2}>
                  {getHitTitle(item)}
                </Text>
                {item.publishedAt && (
                  <Text style={styles.resultTime}>{timeAgo(item.publishedAt, lang)}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    paddingVertical: Spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  listContent: {
    padding: Spacing.lg,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  resultImage: {
    width: 100,
    height: 80,
  },
  resultContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
  },
  resultBadge: {
    alignSelf: "flex-start",
    backgroundColor: Brand.primary + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginBottom: 4,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Brand.primary,
    textTransform: "uppercase",
  },
  resultTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.text,
    lineHeight: 18,
  },
  resultTime: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
});
