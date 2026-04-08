import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
  useWindowDimensions,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";

import { VideoCard } from "@/components/ui/VideoCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorView } from "@/components/ui/ErrorView";

import { getVideoBySlug, getRelatedVideos } from "@/lib/requests";
import { useAppStore } from "@/store/useAppStore";
import { formatDate, formatCount, getYouTubeId } from "@/lib/utils";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { Video } from "@/types";

export default function VideoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;
  const lang = useAppStore((s) => s.language);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);

  const fetchVideo = useCallback(async () => {
    if (!slug) return;
    try {
      setError(false);
      setLoading(true);
      const res = await getVideoBySlug(slug);
      const data = (res as any).video;
      setVideo(data);

      if (data?._id) {
        try {
          const relRes = await getRelatedVideos(data._id);
          setRelated((relRes as any).videos ?? []);
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
    fetchVideo();
  }, [fetchVideo]);

  const handleShare = async () => {
    if (!video) return;
    const title = video.title[lang] || video.title.en;
    try {
      await Share.share({
        title,
        message: `${title}\n\nWatch on Tea Time Telugu`,
        url: video.videoUrl,
      });
    } catch {
      // ignore
    }
  };

  if (loading) return <LoadingSpinner message="Loading video..." />;
  if (error || !video) return <ErrorView onRetry={fetchVideo} />;

  const title = video.title[lang] || video.title.en || video.title.te;
  const youtubeId = getYouTubeId(video.videoUrl);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Video Player */}
      <View style={[styles.playerContainer, { width: SCREEN_WIDTH, height: VIDEO_HEIGHT }]}>
        {youtubeId ? (
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            width={SCREEN_WIDTH}
            videoId={youtubeId}
            play={false}
            webViewProps={{
              allowsInlineMediaPlayback: true,
            }}
          />
        ) : (
          <TouchableOpacity
            style={styles.fallbackPlayer}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(video.videoUrl)}
          >
            <Image
              source={{ uri: video.thumbnail }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
              <Text style={styles.playText}>
                {lang === "te" ? "వీడియో చూడండి" : "Open Video"}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Back button overlay */}
        <TouchableOpacity
          style={[styles.backBtnOverlay, { top: Spacing.sm }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Video Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.statsRow}>
            {video.publishedAt && (
              <Text style={styles.statText}>
                {formatDate(video.publishedAt, lang)}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.actionText}>
                {lang === "te" ? "షేర్" : "Share"}
              </Text>
            </TouchableOpacity>
            {video.videoUrl && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(video.videoUrl)}
              >
                <Ionicons name="open-outline" size={20} color={Colors.light.textSecondary} />
                <Text style={styles.actionText}>
                  {lang === "te" ? "YouTubeలో చూడండి" : "YouTube"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tags */}
        {(video.tags[lang]?.length ?? 0) > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.tagsRow}>
              {video.tags[lang]?.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related Videos */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <SectionHeader
              title={lang === "te" ? "సంబంధిత వీడియోలు" : "Related Videos"}
            />
            {related.slice(0, 8).map((item) => (
              <VideoCard
                key={item._id}
                item={item}
                lang={lang}
                variant="horizontal"
                onPress={() => router.push(`/video/${item.slug}` as any)}
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

  playerContainer: {
    backgroundColor: "#000",
    position: "relative",
  },
  player: {
    flex: 1,
    backgroundColor: "#000",
  },
  fallbackPlayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    gap: Spacing.sm,
  },
  playText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#fff",
  },
  backBtnOverlay: {
    position: "absolute",
    left: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  infoSection: {
    padding: Spacing.lg,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.light.text,
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.lg,
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
  statDot: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.xxl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },

  tagsSection: {
    padding: Spacing.lg,
    backgroundColor: "#fff",
    marginTop: 1,
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
