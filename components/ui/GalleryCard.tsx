import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import { timeAgo } from "@/lib/utils";
import type { Gallery, Language } from "@/types";

interface Props {
  item: Gallery;
  lang?: Language;
  onPress: () => void;
  variant?: "standard" | "compact";
}

export function GalleryCard({ item, lang = "en", onPress, variant = "standard" }: Props) {
  const title = item.title[lang] || item.title.en || item.title.te;
  const time = item.publishedAt ? timeAgo(item.publishedAt, lang) : "";
  const imageCount = item.images?.length ?? 0;

  if (variant === "compact") {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.compactImageWrap}>
          <Image
            source={{ uri: item.thumbnail || item.images?.[0] }}
            style={styles.compactImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.imageCountBadge}>
            <Ionicons name="images" size={10} color="#fff" />
            <Text style={styles.imageCountText}>{imageCount}</Text>
          </View>
        </View>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.standardCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.standardImageWrap}>
        <Image
          source={{ uri: item.thumbnail || item.images?.[0] }}
          style={styles.standardImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.imageCountBadgeLg}>
          <Ionicons name="images" size={14} color="#fff" />
          <Text style={styles.imageCountTextLg}>{imageCount} Photos</Text>
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
    height: 260,
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

  compactCard: {
    flex: 1,
    marginRight: Spacing.md,
  },
  compactImageWrap: {
    position: "relative",
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  compactImage: {
    width: "100%",
    aspectRatio: 0.75,
  },
  compactTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.text,
    lineHeight: 18,
  },

  imageCountBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  imageCountText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  imageCountBadgeLg: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  imageCountTextLg: {
    fontSize: FontSize.xs,
    color: "#fff",
    fontWeight: "600",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },
});
