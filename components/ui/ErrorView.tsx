import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { Brand } from "@/constants/theme";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({
  title = "Something went wrong",
  message = "Please try again later",
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={64} color={Colors.light.textMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyView({
  title = "Nothing here yet",
  message = "Check back later for new content",
  icon = "newspaper-outline" as keyof typeof Ionicons.glyphMap,
}: {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.light.textMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    marginTop: Spacing.lg,
  },
  retryText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
