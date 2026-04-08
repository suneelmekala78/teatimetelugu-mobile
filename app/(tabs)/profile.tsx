import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserStore } from "@/store/useUserStore";
import { useAppStore } from "@/store/useAppStore";
import { logoutUser } from "@/lib/requests";
import { Brand, Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useAppStore((s) => s.language);
  const { user, isAuthenticated, logout } = useUserStore();

  const handleLogout = async () => {
    Alert.alert(
      lang === "te" ? "లాగ్ అవుట్" : "Logout",
      lang === "te"
        ? "మీరు లాగ్ అవుట్ చేయాలనుకుంటున్నారా?"
        : "Are you sure you want to logout?",
      [
        { text: lang === "te" ? "రద్దు" : "Cancel", style: "cancel" },
        {
          text: lang === "te" ? "లాగ్ అవుట్" : "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutUser();
            } catch {
              // ignore
            }
            logout();
          },
        },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: lang === "te" ? "కంటెంట్" : "Content",
      items: [
        {
          icon: "images-outline",
          label: lang === "te" ? "గ్యాలరీ" : "Gallery",
          onPress: () => router.push("/gallery" as any),
          showArrow: true,
        },
        {
          icon: "videocam-outline",
          label: lang === "te" ? "వీడియోలు" : "Videos",
          onPress: () => router.navigate("/(tabs)/videos" as any),
          showArrow: true,
        },
      ],
    },
    {
      title: lang === "te" ? "సెట్టింగ్‌లు" : "Settings",
      items: [
        {
          icon: "language-outline",
          label: `${lang === "te" ? "భాష" : "Language"}: ${lang === "en" ? "English" : "తెలుగు"}`,
          onPress: () => {
            useAppStore.getState().setLanguage(lang === "en" ? "te" : "en");
          },
          showArrow: true,
        },
      ],
    },
    {
      title: lang === "te" ? "మరింత" : "More",
      items: [
        {
          icon: "information-circle-outline",
          label: lang === "te" ? "మా గురించి" : "About Us",
          onPress: () => router.push("/about" as any),
          showArrow: true,
        },
        {
          icon: "mail-outline",
          label: lang === "te" ? "మమ్మల్ని సంప్రదించండి" : "Contact Us",
          onPress: () => router.push("/contact" as any),
          showArrow: true,
        },
        {
          icon: "shield-checkmark-outline",
          label: lang === "te" ? "గోప్యతా విధానం" : "Privacy Policy",
          onPress: () => router.push("/privacy" as any),
          showArrow: true,
        },
        {
          icon: "share-social-outline",
          label: lang === "te" ? "యాప్ షేర్ చేయండి" : "Share App",
          onPress: () => {
            // TODO: Replace with actual store link
            Linking.openURL("https://teatimetelugu.com");
          },
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === "te" ? "ప్రొఫైల్" : "Profile"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.8}
          onPress={() => {
            if (isAuthenticated) return;
            router.push("/auth/login" as any);
          }}
        >
          {isAuthenticated && user ? (
            <>
              <View style={styles.avatarWrap}>
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.fullName}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.light.textMuted}
              />
            </>
          ) : (
            <>
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color={Brand.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {lang === "te" ? "సైన్ ఇన్ చేయండి" : "Sign In"}
                </Text>
                <Text style={styles.profileEmail}>
                  {lang === "te"
                    ? "కామెంట్‌లు & రియాక్షన్‌లు కోసం"
                    : "For comments & reactions"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.light.textMuted}
              />
            </>
          )}
        </TouchableOpacity>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={item.color || Colors.light.textSecondary}
                    />
                    <Text
                      style={[
                        styles.menuLabel,
                        item.color ? { color: item.color } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.showArrow && (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={Colors.light.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                  {index < section.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        {isAuthenticated && (
          <View style={styles.menuSection}>
            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={22} color={Colors.light.error} />
                <Text style={[styles.menuLabel, { color: Colors.light.error }]}>
                  {lang === "te" ? "లాగ్ అవుట్" : "Logout"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Tea Time Telugu</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.light.text,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  avatarWrap: {},
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    backgroundColor: Brand.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Brand.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.text,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },

  menuSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.light.text,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.borderLight,
    marginLeft: 54,
  },

  appInfo: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: 2,
  },
  appInfoText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.textMuted,
  },
  appVersion: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
  },
});
