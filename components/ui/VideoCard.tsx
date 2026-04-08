import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, Radius, Shadow, Spacing, Brand } from "@/constants/theme";
import { getYouTubeThumbnail, timeAgo, formatCount } from "@/lib/utils";
import type { Video, Language } from "@/types";

interface Props {
  item: Video;
  lang?: Language;
  onPress: () => void;
  variant?: "standard" | "compact" | "horizontal";
}

export function VideoCard({ item, lang = "en", onPress, variant = "standard" }: Props) {
  const title = item.title[lang] || item.title.en || item.title.te;
  const time = item.publishedAt ? timeAgo(item.publishedAt, lang) : "";
  const thumbnail =
    item.thumbnail || getYouTubeThumbnail(item.videoUrl) || "";

  if (variant === "horizontal") {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.horizontalImageWrap}>
          <Image
            source={{ uri: thumbnail }}
            style={styles.horizontalImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
        <View style={styles.horizontalContent}>
          <Text style={styles.horizontalTitle} numberOfLines={3}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === "compact") {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.compactImageWrap}>
          <Image
            source={{ uri: thumbnail }}
            style={styles.compactImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.playOverlaySmall}>
            <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  // Standard
  return (
    <TouchableOpacity
      style={styles.standardCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.standardImageWrap}>
        <Image
          source={{ uri: thumbnail }}
          style={styles.standardImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
        </View>
      </View>
      <View style={styles.standardContent}>
        <Text style={styles.standardTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color={Colors.light.textMuted} />
          <Text style={styles.metaText}> {time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Standard
  standardCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  standardImageWrap: {
    position: "relative",
  },
  standardImage: {
    width: "100%",
    height: 190,
  },
  standardContent: {
    padding: Spacing.md,
  },
  standardTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },

  // Horizontal
  horizontalCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  horizontalImageWrap: {
    position: "relative",
  },
  horizontalImage: {
    width: 140,
    height: 95,
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  horizontalTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.light.text,
    lineHeight: 20,
  },

  // Compact
  compactCard: {
    width: 180,
    marginRight: Spacing.md,
  },
  compactImageWrap: {
    position: "relative",
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  compactImage: {
    width: 180,
    height: 110,
  },
  compactTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.text,
    lineHeight: 18,
  },

  // Play overlays
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  playOverlaySmall: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  // Shared
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },
});
