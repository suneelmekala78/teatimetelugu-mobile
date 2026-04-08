import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Brand, Colors, FontSize, Spacing } from "@/constants/theme";

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen = true }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Brand.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
});
