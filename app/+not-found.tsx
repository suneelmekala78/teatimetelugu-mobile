import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="compass-outline" size={80} color={Colors.light.textMuted} />
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.message}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
        activeOpacity={0.8}
      >
        <Ionicons name="home" size={18} color="#fff" />
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.light.background,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.light.text,
    marginTop: Spacing.lg,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.lg,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
});
