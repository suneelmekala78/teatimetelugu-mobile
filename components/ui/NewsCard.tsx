import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Colors, FontSize, Radius, Shadow, Spacing, TeluguFont } from "@/constants/theme";
import { getCategoryLabel } from "@/constants/categories";
import { timeAgo, formatCount } from "@/lib/utils";
import type { News, Language } from "@/types";

interface Props {
  item: News;
  lang?: Language;
  onPress: () => void;
  variant?: "standard" | "compact" | "featured" | "horizontal";
}

export function NewsCard({ item, lang = "en", onPress, variant = "standard" }: Props) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const title = item.title[lang] || item.title.en || item.title.te;
  const category = getCategoryLabel(item.category, lang);
  const time = item.publishedAt ? timeAgo(item.publishedAt, lang) : "";

  if (variant === "featured") {
    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.featuredImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.featuredOverlay} />
        <View style={styles.featuredContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={3}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.featuredMeta}>{time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === "horizontal") {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.horizontalImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalCategoryRow}>
            <Text style={styles.smallCategoryText}>{category}</Text>
            <Text style={styles.metaText}> · {time}</Text>
          </View>
          <Text style={styles.horizontalTitle} numberOfLines={3}>
            {title}
          </Text>
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
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.compactImage}
          contentFit="cover"
          transition={200}
        />
        <Text style={styles.compactTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.compactMeta}>{time}</Text>
      </TouchableOpacity>
    );
  }

  // Standard card
  return (
    <TouchableOpacity
      style={styles.standardCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.standardImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.standardContent}>
        <View style={styles.standardCategoryRow}>
          <Text style={styles.smallCategoryText}>{category}</Text>
          <Text style={styles.metaText}>{time}</Text>
        </View>
        <Text style={styles.standardTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color={Colors.light.textMuted} />
          <Text style={styles.metaText}> {time}</Text>
          {item.commentsCount > 0 && (
            <>
              <Text style={styles.metaText}>  ·  </Text>
              <Ionicons name="chatbubble-outline" size={11} color={Colors.light.textMuted} />
              <Text style={styles.metaText}> {item.commentsCount}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Featured
  featuredCard: {
    height: 220,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  featuredContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginBottom: Spacing.sm,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: "#fff",
    textTransform: "uppercase",
  },
  featuredTitle: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    fontFamily: TeluguFont,
    color: "#fff",
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  featuredMeta: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.8)",
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
  horizontalImage: {
    width: 120,
    height: 100,
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  horizontalCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  horizontalTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Colors.light.text,
    lineHeight: 20,
    flex: 1,
  },

  // Compact
  compactCard: {
    width: 160,
    marginRight: Spacing.md,
  },
  compactImage: {
    width: 160,
    height: 100,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  compactTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  compactMeta: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },

  // Standard
  standardCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  standardImage: {
    width: "100%",
    height: 190,
  },
  standardContent: {
    padding: Spacing.md,
  },
  standardCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  standardTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Colors.light.text,
    lineHeight: 23,
    marginBottom: Spacing.sm,
  },

  // Shared
  smallCategoryText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    fontFamily: TeluguFont,
    color: Brand.primary,
    textTransform: "uppercase",
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
