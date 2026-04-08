import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Brand, Colors, FontSize, TeluguFont } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const lang = useAppStore((s) => s.language);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarButton: HapticTab,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          ...styles.tabBar,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: lang === "te" ? "హోమ్" : "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          title: lang === "te" ? "షార్ట్స్" : "Shorts",
          headerShown: false,
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "flash" : "flash-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: lang === "te" ? "గ్యాలరీ" : "Gallery",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "images" : "images-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: lang === "te" ? "వీడియోలు" : "Videos",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "play-circle" : "play-circle-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: lang === "te" ? "ప్రొఫైల్" : "Profile",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.tabBar,
    borderTopColor: Colors.light.tabBarBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    fontFamily: TeluguFont,
  },
  header: {
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: FontSize.lg,
    fontFamily: TeluguFont,
  },
});
