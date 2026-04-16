import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Colors, FontSize, Spacing, TeluguFont } from "@/constants/theme";

interface Props {
  title: string;
  onSeeAll?: () => void;
  seeAllText?: string;
  style?: ViewStyle;
}

export function SectionHeader({ title, onSeeAll, seeAllText = "See All", style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>{seeAllText}</Text>
          <Ionicons name="chevron-forward" size={14} color={Brand.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    fontFamily: TeluguFont,
    color: Colors.light.text,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: TeluguFont,
    color: Brand.primary,
  },
});
