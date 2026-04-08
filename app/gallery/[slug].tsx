import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
  FlatList,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GalleryCard } from "@/components/ui/GalleryCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ReactionsBar } from "@/components/article/ReactionsBar";
import { CommentsSection } from "@/components/article/CommentsSection";
import { ErrorView } from "@/components/ui/ErrorView";
import { ZoomableImage } from "@/components/ui/ZoomableImage";

import { getGalleryBySlug, getRelatedGallery } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import { formatDate, formatCount } from "@/lib/utils";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { Gallery } from "@/types";

export default function GalleryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const lang = useAppStore((s) => s.language);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [related, setRelated] = useState<Gallery[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fetchGallery = useCallback(async () => {
    if (!slug) return;
    try {
      setError(false);
      setLoading(true);
      const res = await getGalleryBySlug(slug);
      const data = (res as any).gallery;
      setGallery(data);

      if (data?._id) {
        try {
          const relRes = await getRelatedGallery(data._id);
          setRelated((relRes as any).galleries ?? []);
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
    fetchGallery();
  }, [fetchGallery]);

  const handleShare = async () => {
    if (!gallery) return;
    const title = gallery.title[lang] || gallery.title.en;
    try {
      await Share.share({
        title,
        message: `${title}\n\nView on Tea Time Telugu`,
      });
    } catch {
      // ignore
    }
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  if (loading) return <LoadingSpinner message="Loading gallery..." />;
  if (error || !gallery) return <ErrorView onRetry={fetchGallery} />;

  const title = gallery.title[lang] || gallery.title.en || gallery.title.te;
  const images = gallery.images ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {lang === "te" ? "గ్యాలరీ" : "Gallery"}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            {gallery.publishedAt && (
              <Text style={styles.metaText}>
                {formatDate(gallery.publishedAt, lang)}
              </Text>
            )}
            <Text style={styles.metaText}>·</Text>
            <Text style={styles.metaText}>{images.length} Photos</Text>
          </View>
        </View>

        {/* Image Grid */}
        <View style={styles.imageGrid}>
          {images.map((img, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.gridItem, { width: (SCREEN_WIDTH - Spacing.sm * 2 - Spacing.sm) / 2, height: (SCREEN_WIDTH - Spacing.sm * 2 - Spacing.sm) / 2 * 1.25 }]}
              activeOpacity={0.8}
              onPress={() => openViewer(index)}
            >
              <Image
                source={{ uri: img }}
                style={styles.gridImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.imageNumber}>
                <Text style={styles.imageNumberText}>{index + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reactions & Comments */}
        <View style={styles.engagementSection}>
          <ReactionsBar
            targetId={gallery._id}
            targetModel="Gallery"
            onLogin={() => router.push("/auth/login" as any)}
          />
          <View style={styles.engagementDivider} />
          <CommentsSection
            targetId={gallery._id}
            targetModel="Gallery"
            onLogin={() => router.push("/auth/login" as any)}
          />
        </View>

        {/* Related Galleries */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <SectionHeader
              title={lang === "te" ? "సంబంధిత గ్యాలరీలు" : "Related Galleries"}
            />
            <FlatList
              horizontal
              data={related.slice(0, 6)}
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

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>

      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={[styles.viewerContainer, { paddingTop: insets.top }]}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              style={styles.viewerBtn}
              onPress={() => setViewerVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.viewerCounter}>
              {viewerIndex + 1} / {images.length}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            horizontal
            pagingEnabled
            data={images}
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onScroll={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              if (newIndex !== viewerIndex) setViewerIndex(newIndex);
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={[styles.viewerSlide, { width: SCREEN_WIDTH }]}>
                <ZoomableImage uri={item} />
              </View>
            )}
          />
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
  navTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.text,
  },

  titleSection: {
    padding: Spacing.lg,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.light.text,
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },

  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  gridItem: {
    borderRadius: Radius.md,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  imageNumber: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imageNumberText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  relatedSection: {
    marginTop: Spacing.xxl,
  },

  engagementSection: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: "#fff",
  },
  engagementDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },

  // Viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  viewerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  viewerCounter: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#fff",
  },
  viewerSlide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: {
  },
});
