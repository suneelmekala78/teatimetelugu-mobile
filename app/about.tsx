import React from "react";
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppStore } from "@/store/useAppStore";
import { Brand, Colors, FontSize, Radius, Spacing, Shadow } from "@/constants/theme";

export default function AboutScreen() {
  const lang = useAppStore((s) => s.language);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo & Brand */}
      <View style={styles.heroSection}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.appName}>Tea Time Telugu</Text>
        <Text style={styles.tagline}>
          {lang === "te"
            ? "తెలుగు వార్తలు, సినిమా, గాసిప్స్ & మరిన్ని"
            : "Telugu News, Movies, Gossips & More"}
        </Text>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {lang === "te" ? "మా గురించి" : "About Us"}
        </Text>
        <Text style={styles.cardText}>
          {lang === "te"
            ? "Tea Time Telugu అనేది తెలుగు వార్తలు, సినిమా అప్‌డేట్‌లు, గాసిప్స్, ఫోటో గ్యాలరీలు మరియు వీడియోలను అందించే ప్రముఖ డిజిటల్ మీడియా ప్లాట్‌ఫాం. మేము ఆంధ్ర ప్రదేశ్, తెలంగాణ, జాతీయ మరియు అంతర్జాతీయ వార్తలను ఇంగ్లీష్ మరియు తెలుగు భాషల్లో అందిస్తాము."
            : "Tea Time Telugu is a leading digital media platform delivering Telugu news, movie updates, gossips, photo galleries, and videos. We cover Andhra Pradesh, Telangana, national, and international news in both English and Telugu languages."}
        </Text>
      </View>

      {/* Features */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {lang === "te" ? "ఫీచర్లు" : "Features"}
        </Text>
        {[
          {
            icon: "newspaper-outline" as const,
            text: lang === "te" ? "తాజా వార్తలు & అప్‌డేట్‌లు" : "Latest News & Updates",
          },
          {
            icon: "film-outline" as const,
            text: lang === "te" ? "సినిమా వార్తలు & రివ్యూలు" : "Movie News & Reviews",
          },
          {
            icon: "images-outline" as const,
            text: lang === "te" ? "ఫోటో గ్యాలరీలు" : "Photo Galleries",
          },
          {
            icon: "videocam-outline" as const,
            text: lang === "te" ? "వీడియోలు & ట్రైలర్లు" : "Videos & Trailers",
          },
          {
            icon: "language-outline" as const,
            text: lang === "te" ? "ద్విభాషా మద్దతు" : "Bilingual Support (EN/TE)",
          },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={item.icon} size={20} color={Brand.primary} />
            </View>
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Connect */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {lang === "te" ? "ఫాలో అవ్వండి" : "Follow Us"}
        </Text>
        <View style={styles.socialRow}>
          {[
            { icon: "logo-youtube" as const, url: "https://youtube.com", color: "#FF0000" },
            { icon: "logo-instagram" as const, url: "https://instagram.com", color: "#E4405F" },
            { icon: "logo-facebook" as const, url: "https://facebook.com", color: "#1877F2" },
            { icon: "logo-twitter" as const, url: "https://twitter.com", color: "#1DA1F2" },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.socialBtn, { backgroundColor: item.color + "15" }]}
              onPress={() => Linking.openURL(item.url)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={24} color={item.color} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.copyright}>
        © {new Date().getFullYear()} Tea Time Telugu. All rights reserved.
      </Text>

      <View style={{ height: insets.bottom + 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
  },

  heroSection: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.light.text,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    maxWidth: 260,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  cardText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    fontWeight: "500",
  },

  socialRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  copyright: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
    marginTop: Spacing.lg,
  },
});
