import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  Platform,
  TextInput,
  Keyboard,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { NewsCard } from "@/components/ui/NewsCard";
import { VideoCard } from "@/components/ui/VideoCard";
import { GalleryCard } from "@/components/ui/GalleryCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorView } from "@/components/ui/ErrorView";

import {
  getHomeConfig,
  getLatestNews,
  getMostViewedNews,
  getCategoryNews,
  getPublishedNews,
  getLatestGallery,
  getLatestVideos,
  searchContent,
} from "@/lib/requests";
import { timeAgo } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { getCategoryLabel, getSubCategoryLabel, NAV_CATEGORIES, getCategoryIcon } from "@/constants/categories";
import { Brand, Colors, FontSize, Radius, Spacing, Shadow, TeluguFont } from "@/constants/theme";
import type { News, Video, Gallery, HomeConfig, MovieEntry, CollectionEntry, SearchHit, SearchResult } from "@/types";

/* ─── Movie Table sub-component ─── */

interface MovieTableTab {
  label: string;
  value: string;
}

interface BilingualField {
  en: string;
  te: string;
}

function MovieTable({
  title,
  tabs,
  rows,
  nameKey,
  valueKey,
  lang,
}: {
  title: string;
  tabs: MovieTableTab[];
  rows: Record<string, any>[];
  nameKey: string;
  valueKey: string;
  lang: string;
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.value || "");
  const filtered = rows.filter((r: any) => r?.category?.en === activeTab);

  return (
    <View style={styles.movieTableContainer}>
      <Text style={styles.movieTableTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.movieTabsRow}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.movieTab,
              activeTab === tab.value && styles.movieTabActive,
            ]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text
              style={[
                styles.movieTabText,
                activeTab === tab.value && styles.movieTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.movieTableHeader}>
        <Text style={styles.movieTableHeaderText}>
          {lang === "te" ? "పేరు" : "Name"}
        </Text>
        <Text style={styles.movieTableHeaderText}>
          {lang === "te" ? "వివరాలు" : "Details"}
        </Text>
      </View>
      {filtered.map((item: any, i: number) => {
        const name =
          item?.movie?.[lang] ||
          item?.[nameKey]?.[lang] ||
          item?.movie?.en;
        const value =
          item?.[valueKey]?.[lang] ||
          item?.[valueKey]?.en;
        return (
          <View
            key={i}
            style={[
              styles.movieTableRow,
              i % 2 === 0 && styles.movieTableRowAlt,
            ]}
          >
            <Text style={styles.movieTableCell} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.movieTableCellValue} numberOfLines={1}>
              {value}
            </Text>
          </View>
        );
      })}
      {filtered.length === 0 && (
        <View style={styles.movieTableRow}>
          <Text style={styles.movieTableEmptyText}>
            {lang === "te" ? "డేటా లేదు" : "No data available"}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const lang = useAppStore((s) => s.language);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Search overlay state
  const [showSearch, setShowSearch] = useState(false);
  const [categorySidebarOpen, setCategorySidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchHits, setSearchHits] = useState<(SearchHit & { _index: string })[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);
  const [latestNews, setLatestNews] = useState<News[]>([]);
  const [mostViewed, setMostViewed] = useState<News[]>([]);
  const [reviews, setReviews] = useState<News[]>([]);
  const [categoryNewsMap, setCategoryNewsMap] = useState<Record<string, News[]>>({});
  const [otherPostsMap, setOtherPostsMap] = useState<Record<string, News[]>>({});
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      setError(false);
      const CATEGORY_SECTIONS = ["movies", "gossips", "politics", "sports"];
      const OTHER_SECTIONS = ["technology", "business", "health"];

      const [homeRes, latestRes, viewedRes, reviewsRes, galleryRes, videoRes, ...catAndOtherRes] =
        await Promise.all([
          getHomeConfig().catch(() => null),
          getLatestNews(15).catch(() => ({ news: [] })),
          getMostViewedNews(10).catch(() => ({ news: [] })),
          getCategoryNews("reviews", 4).catch(() => ({ news: [] })),
          getLatestGallery(6).catch(() => ({ galleries: [] })),
          getLatestVideos(6).catch(() => ({ videos: [] })),
          ...CATEGORY_SECTIONS.map((cat) =>
            getCategoryNews(cat, 3).catch(() => ({ news: [] }))
          ),
          ...OTHER_SECTIONS.map((cat) =>
            getPublishedNews({ category: cat, page: 1, limit: 6 }).catch(() => ({ news: [] }))
          ),
        ]);

      if (homeRes?.config) setHomeConfig(homeRes.config);
      setLatestNews((latestRes as any).news ?? []);
      setMostViewed((viewedRes as any).news ?? []);
      setReviews((reviewsRes as any).news ?? []);
      setGalleries((galleryRes as any).galleries ?? []);
      setVideos((videoRes as any).videos ?? []);

      const catMap: Record<string, News[]> = {};
      CATEGORY_SECTIONS.forEach((cat, i) => {
        catMap[cat] = (catAndOtherRes[i] as any)?.news ?? [];
      });
      setCategoryNewsMap(catMap);

      const otherMap: Record<string, News[]> = {};
      OTHER_SECTIONS.forEach((cat, i) => {
        otherMap[cat] = (catAndOtherRes[CATEGORY_SECTIONS.length + i] as any)?.news ?? [];
      });
      setOtherPostsMap(otherMap);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const openSearch = useCallback(() => {
    setShowSearch(true);
    setSearchQuery("");
    setSearchHits([]);
    setSearched(false);
  }, []);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchHits([]);
    setSearched(false);
    Keyboard.dismiss();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    setSearched(true);
    try {
      const res = await searchContent({ q: q.trim(), limit: 30 });
      const data = res as any;
      if (data.results) {
        const hits = data.results.flatMap((r: SearchResult) =>
          r.hits.map((h: SearchHit) => ({ ...h, _index: r.index }))
        );
        setSearchHits(hits);
      } else if (data.hits) {
        setSearchHits(data.hits.map((h: SearchHit) => ({ ...h, _index: "news" })));
      } else {
        setSearchHits([]);
      }
    } catch {
      setSearchHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const getHitTitle = (hit: SearchHit) => {
    if (lang === "te") return hit.title_te || hit.name_te || hit.title_en || hit.name_en || "";
    return hit.title_en || hit.name_en || hit.title_te || hit.name_te || "";
  };

  const navigateToHit = (hit: SearchHit & { _index: string }) => {
    closeSearch();
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

  if (loading) return <LoadingSpinner message="Loading Tea Time Telugu..." />;
  if (error && latestNews.length === 0)
    return <ErrorView onRetry={fetchAll} />;

  // Breaking news from home config
  const breakingNews = homeConfig?.breakingNews
    ?.sort((a, b) => a.position - b.position)
    .map((b) => b.news)
    .filter(Boolean) ?? [];

  // Trending news from home config
  const trendingNews = homeConfig?.trendingNews
    ?.sort((a, b) => a.position - b.position)
    .map((t) => t.news)
    .filter(Boolean) ?? [];

  // Hot topics from home config
  const hotTopics = homeConfig?.hotTopics
    ?.sort((a, b) => a.position - b.position)
    .map((h) => h.news)
    .filter(Boolean) ?? [];

  // Movie tables from home config
  const movieReleases = homeConfig?.movieReleases ?? [];
  const movieCollections = homeConfig?.movieCollections ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/logo.jpg")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={openSearch}
          >
            <Ionicons name="search-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => setCategorySidebarOpen(true)}
          >
            <Ionicons name="menu-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Brand.primary]}
            tintColor={Brand.primary}
          />
        }
      >
        {/* Breaking News Banner */}
        {breakingNews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.breakingHeader}>
              <LinearGradient
                colors={["#FF2D75", "#F25A23"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.breakingBadge}
              >
                <Ionicons name="flash" size={12} color="#fff" />
                <Text style={styles.breakingBadgeText}>
                  {lang === "te" ? "బ్రేకింగ్ న్యూస్" : "BREAKING NEWS"}
                </Text>
              </LinearGradient>
            </View>
            <FlatList
              horizontal
              data={breakingNews}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.breakingCard, { width: 200 }]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push(`/article/${item.slug}` as any)
                  }
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.breakingImage}
                    contentFit="cover"
                    transition={300}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.breakingGradient}
                  />
                  <View style={styles.breakingContent}>
                    <Text style={styles.breakingTitle} numberOfLines={2}>
                      {item.title[lang] || item.title.en}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Trending News */}
        {trendingNews.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={lang === "te" ? "ట్రెండింగ్" : "Trending Now"}
            />
            <FlatList
              horizontal
              data={trendingNews}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.trendingCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(`/article/${item.slug}` as any)
                  }
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.trendingImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <Text style={styles.trendingTitle} numberOfLines={2}>
                    {item.title[lang] || item.title.en}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Hot Topics */}
        {hotTopics.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={lang === "te" ? "హాట్ టాపిక్స్" : "Hot Topics"}
            />
            <FlatList
              horizontal
              data={hotTopics}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.hotTopicCard, { width: 200 }]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push(`/article/${item.slug}` as any)
                  }
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.hotTopicImage}
                    contentFit="cover"
                    transition={300}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    style={styles.hotTopicGradient}
                  />
                  <View style={styles.hotTopicContent}>
                    <Text style={styles.hotTopicTitle} numberOfLines={2}>
                      {item.title[lang] || item.title.en}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Latest News */}
        {latestNews.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={lang === "te" ? "తాజా వార్తలు" : "Latest News"}
            />
            <FlatList
              horizontal
              data={latestNews.slice(0, 8)}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <NewsCard
                  item={item}
                  lang={lang}
                  variant="compact"
                  onPress={() => router.push(`/article/${item.slug}` as any)}
                />
              )}
            />
          </View>
        )}

        {/* Most Viewed */}
        {mostViewed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={lang === "te" ? "అత్యధిక వీక్షణలు" : "Most Viewed"}
            />
            <FlatList
              horizontal
              data={mostViewed.slice(0, 8)}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              renderItem={({ item }) => (
                <NewsCard
                  item={item}
                  lang={lang}
                  variant="compact"
                  onPress={() => router.push(`/article/${item.slug}` as any)}
                />
              )}
            />
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <SectionHeader
              title={lang === "te" ? "రివ్యూలు" : "Reviews"}
              onSeeAll={() => router.push("/category/reviews" as any)}
              seeAllText={lang === "te" ? "మరిన్ని చూడండి" : "See All"}
            />
            <FlatList
              horizontal
              data={reviews}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.reviewCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/article/${item.slug}` as any)
                  }
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.reviewImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.reviewContent}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= (item.movieRating || 0) ? "star" : "star-outline"}
                          size={14}
                          color={star <= (item.movieRating || 0) ? "#FFD700" : "rgba(255,255,255,0.3)"}
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewTitle} numberOfLines={2}>
                      {item.title[lang] || item.title.en}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Gallery Preview */}
        {galleries.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={lang === "te" ? "గ్యాలరీ" : "Gallery"}
              onSeeAll={() => router.push("/gallery" as any)}
              seeAllText={lang === "te" ? "మరిన్ని చూడండి" : "See All"}
            />
            <FlatList
              horizontal
              data={galleries}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              renderItem={({ item }) => (
                <View style={{ width: 150 }}>
                  <GalleryCard
                    item={item}
                    lang={lang}
                    variant="compact"
                    onPress={() => router.push(`/gallery/${item.slug}` as any)}
                  />
                </View>
              )}
            />
          </View>
        )}

        {/* Category News */}
        {Object.keys(categoryNewsMap).some((k) => categoryNewsMap[k].length > 0) && (
          <View style={styles.section}>
            {["movies", "gossips", "politics", "sports"].map((cat) => {
              const posts = categoryNewsMap[cat];
              if (!posts || posts.length === 0) return null;
              return (
                <View key={cat} style={styles.catNewsBlock}>
                  <TouchableOpacity
                    style={styles.catNewsHeader}
                    onPress={() => router.push(`/category/${cat}` as any)}
                  >
                    <Text style={styles.catNewsLabel}>
                      {getCategoryLabel(cat, lang)}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={Brand.primary} />
                  </TouchableOpacity>
                  {posts.map((post) => (
                    <TouchableOpacity
                      key={post._id}
                      style={styles.catNewsCard}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push(`/article/${post.slug}` as any)
                      }
                    >
                      <Image
                        source={{ uri: post.thumbnail }}
                        style={styles.catNewsImage}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.catNewsContent}>
                        <Text style={styles.catNewsSub}>
                          {post.subCategory
                            ? getSubCategoryLabel(post.category, post.subCategory, lang)
                            : getCategoryLabel(post.category, lang)}
                        </Text>
                        <Text style={styles.catNewsTitle} numberOfLines={2}>
                          {post.title[lang] || post.title.en}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Videos Preview */}
        {videos.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={lang === "te" ? "వీడియోలు" : "Videos"}
            />
            <FlatList
              horizontal
              data={videos.slice(0, 6)}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              renderItem={({ item }) => (
                <VideoCard
                  item={item}
                  lang={lang}
                  variant="compact"
                  onPress={() => router.push(`/video/${item.slug}` as any)}
                />
              )}
            />
          </View>
        )}

        {/* More Latest News */}
        {latestNews.length > 8 && (
          <View style={styles.section}>
            <SectionHeader
              title={lang === "te" ? "మరిన్ని వార్తలు" : "More Stories"}
            />
            <FlatList
              horizontal
              data={latestNews.slice(8)}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <NewsCard
                  item={item}
                  lang={lang}
                  variant="compact"
                  onPress={() => router.push(`/article/${item.slug}` as any)}
                />
              )}
            />
          </View>
        )}

        {/* Other Posts – Technology, Business, Health */}
        {["technology", "business", "health"].map((cat) => {
          const posts = otherPostsMap[cat];
          if (!posts || posts.length === 0) return null;
          return (
            <View key={cat} style={styles.section}>
              <SectionHeader
                title={getCategoryLabel(cat, lang)}
                onSeeAll={() => router.push(`/category/${cat}` as any)}
                seeAllText={lang === "te" ? "మరిన్ని చూడండి" : "See All"}
              />
              {posts.map((post) => (
                <NewsCard
                  key={post._id}
                  item={post}
                  lang={lang}
                  variant="horizontal"
                  onPress={() =>
                    router.push(`/article/${post.slug}` as any)
                  }
                />
              ))}
            </View>
          );
        })}

        {/* Movie Releases & Collections */}
        {(movieReleases.length > 0 || movieCollections.length > 0) && (
          <View style={styles.section}>
            {movieReleases.length > 0 && (
              <MovieTable
                title={lang === "te" ? "సినిమా విడుదలలు" : "Movie Releases"}
                tabs={[
                  { label: lang === "te" ? "సినిమా" : "Movie", value: "movie" },
                  { label: "OTT", value: "ott" },
                ]}
                rows={movieReleases}
                nameKey="movie"
                valueKey="releaseDate"
                lang={lang}
              />
            )}
            {movieCollections.length > 0 && (
              <MovieTable
                title={lang === "te" ? "సినిమా కలెక్షన్లు" : "Movie Collections"}
                tabs={[
                  { label: lang === "te" ? "1వ రోజు AP&TS" : "1st Day AP&TS", value: "1st-day-ap&ts" },
                  { label: lang === "te" ? "1వ రోజు WW" : "1st Day WW", value: "1st-day-ww" },
                  { label: lang === "te" ? "మొత్తం WW" : "Total WW", value: "closing-ww" },
                ]}
                rows={movieCollections}
                nameKey="movie"
                valueKey="amount"
                lang={lang}
              />
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>

      {/* Search Overlay Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={false}
        onRequestClose={closeSearch}
      >
        <View style={[styles.searchOverlay, { paddingTop: insets.top }]}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <TouchableOpacity style={styles.searchBackBtn} onPress={closeSearch}>
              <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.light.textMuted} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={lang === "te" ? "వార్తలు వెతకండి..." : "Search news..."}
                placeholderTextColor={Colors.light.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => doSearch(searchQuery)}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchHits([]); setSearched(false); }}>
                  <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Content */}
          {searching ? (
            <View style={styles.searchCentered}>
              <ActivityIndicator size="large" color={Brand.primary} />
              <Text style={styles.searchStatusText}>
                {lang === "te" ? "వెతుకుతోంది..." : "Searching..."}
              </Text>
            </View>
          ) : searched && searchHits.length === 0 ? (
            <View style={styles.searchCentered}>
              <Ionicons name="search-outline" size={48} color={Colors.light.border} />
              <Text style={styles.searchEmptyTitle}>
                {lang === "te" ? "ఫలితాలు కనుగొనబడలేదు" : "No results found"}
              </Text>
              <Text style={styles.searchEmptySubtitle}>
                {lang === "te" ? "వేరే పదం ప్రయత్నించండి" : "Try a different search term"}
              </Text>
            </View>
          ) : !searched ? (
            <View style={styles.searchCentered}>
              <Ionicons name="search" size={48} color={Colors.light.border} />
              <Text style={styles.searchEmptySubtitle}>
                {lang === "te" ? "వార్తలు, వీడియోలు, గ్యాలరీలు వెతకండి" : "Search news, videos & galleries"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchHits}
              keyExtractor={(item) => item.id + item._index}
              contentContainerStyle={{ padding: Spacing.md }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultCard}
                  onPress={() => navigateToHit(item)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.searchResultImage}
                    contentFit="cover"
                  />
                  <View style={styles.searchResultContent}>
                    <View style={styles.searchResultBadge}>
                      <Text style={styles.searchResultBadgeText}>{getIndexLabel(item._index)}</Text>
                    </View>
                    <Text style={styles.searchResultTitle} numberOfLines={2}>
                      {getHitTitle(item)}
                    </Text>
                    {item.publishedAt && (
                      <Text style={styles.searchResultTime}>{timeAgo(item.publishedAt, lang)}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            />
          )}
        </View>
      </Modal>

      {/* Categories Sidebar */}
      <Modal
        visible={categorySidebarOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setCategorySidebarOpen(false)}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.sidebarBackdrop}
            activeOpacity={1}
            onPress={() => setCategorySidebarOpen(false)}
          />
          <View style={[styles.sidebar, { paddingTop: insets.top + Spacing.md }]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>
                {lang === "te" ? "కేటగిరీలు" : "Categories"}
              </Text>
              <TouchableOpacity onPress={() => setCategorySidebarOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Language Switch */}
              <TouchableOpacity
                style={styles.sidebarLangSwitch}
                activeOpacity={0.7}
                onPress={() => {
                  useAppStore.getState().setLanguage(lang === "en" ? "te" : "en");
                }}
              >
                <View style={styles.sidebarIconWrap}>
                  <Ionicons name="language-outline" size={20} color={Brand.primary} />
                </View>
                <Text style={styles.sidebarItemText}>
                  {lang === "te" ? "English" : "తెలుగు"}
                </Text>
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>{lang === "en" ? "EN" : "TE"}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.sidebarDivider} />

              {NAV_CATEGORIES.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.sidebarItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCategorySidebarOpen(false);
                    router.push(`/category/${key}` as any);
                  }}
                >
                  <View style={styles.sidebarIconWrap}>
                    <Ionicons
                      name={getCategoryIcon(key) as any}
                      size={20}
                      color={Brand.primary}
                    />
                  </View>
                  <Text style={styles.sidebarItemText}>
                    {getCategoryLabel(key, lang)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.light.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  logo: {
    width: 75,
    height: 42,
    borderRadius: Radius.xs,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Section
  section: {
    marginTop: Spacing.lg,
  },

  // Breaking News
  breakingHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  breakingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.xs,
  },
  breakingBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    fontFamily: TeluguFont,
    color: "#fff",
    letterSpacing: 1,
  },
  breakingCard: {
    height: 120,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  breakingImage: {
    ...StyleSheet.absoluteFillObject,
  },
  breakingGradient: {
    ...StyleSheet.absoluteFillObject,
    top: "40%",
  },
  breakingContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  breakingTitle: {
    fontSize: FontSize.md,
    fontWeight: "800",
    fontFamily: TeluguFont,
    color: "#fff",
    lineHeight: 20,
  },

  // Trending
  trendingCard: {
    width: 200,
    marginRight: Spacing.md,
  },
  trendingImage: {
    width: 200,
    height: 120,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  trendingTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: Colors.light.text,
    lineHeight: 18,
  },

  // Hot Topics
  hotTopicCard: {
    height: 120,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  hotTopicImage: {
    ...StyleSheet.absoluteFillObject,
  },
  hotTopicGradient: {
    ...StyleSheet.absoluteFillObject,
    top: "35%",
  },
  hotTopicContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  hotTopicTitle: {
    fontSize: FontSize.md,
    fontWeight: "800",
    fontFamily: TeluguFont,
    color: "#fff",
    lineHeight: 22,
  },

  // Reviews
  reviewsSection: {
    marginTop: Spacing.lg,
    backgroundColor: "#111",
    paddingBottom: Spacing.lg,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    overflow: "hidden",
  },
  reviewCard: {
    width: 200,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
  },
  reviewImage: {
    width: 200,
    height: 120,
  },
  reviewContent: {
    padding: Spacing.md,
  },
  starsRow: {
    flexDirection: "row",
    gap: 3,
    marginBottom: Spacing.sm,
  },
  reviewTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: "#fff",
    lineHeight: 18,
  },

  // Category News
  catNewsBlock: {
    marginBottom: Spacing.md,
  },
  catNewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  catNewsLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Brand.primary,
  },
  catNewsCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  catNewsImage: {
    width: 100,
    height: 75,
  },
  catNewsContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
  },
  catNewsSub: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: Colors.light.textMuted,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  catNewsTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: Colors.light.text,
    lineHeight: 18,
  },

  // Movie Table
  movieTableContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  movieTableTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  movieTabsRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  movieTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.borderLight,
  },
  movieTabActive: {
    backgroundColor: Brand.primary,
  },
  movieTabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: Colors.light.textSecondary,
  },
  movieTabTextActive: {
    color: "#fff",
  },
  movieTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: Spacing.xs,
  },
  movieTableHeaderText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
  },
  movieTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  movieTableRowAlt: {
    backgroundColor: Colors.light.borderLight,
    borderRadius: Radius.xs,
  },
  movieTableCell: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: Colors.light.text,
  },
  movieTableCellValue: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: "right",
  },
  movieTableEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },

  // Search Overlay
  searchOverlay: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    gap: Spacing.sm,
  },
  searchBackBtn: {
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
    paddingVertical: 0,
  },
  searchCentered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  searchStatusText: {
    fontSize: FontSize.md,
    color: Colors.light.textMuted,
  },
  searchEmptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  searchEmptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  searchResultCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow.sm,
  },
  searchResultImage: {
    width: 100,
    height: 80,
  },
  searchResultContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: 4,
  },
  searchResultBadge: {
    alignSelf: "flex-start",
    backgroundColor: Brand.primary + "15",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  searchResultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Brand.primary,
    textTransform: "uppercase",
  },
  searchResultTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.text,
    lineHeight: 20,
  },
  searchResultTime: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },

  // Categories Sidebar
  sidebarOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sidebar: {
    width: 220,
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  sidebarTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    fontFamily: TeluguFont,
    color: Colors.light.text,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.borderLight,
  },
  sidebarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  sidebarItemText: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Colors.light.text,
  },
  sidebarLangSwitch: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  langBadge: {
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  langBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#fff",
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
});
