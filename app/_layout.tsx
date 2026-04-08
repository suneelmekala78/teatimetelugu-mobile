import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import "react-native-reanimated";

import { useUserStore } from "@/store/useUserStore";
import { useAppStore } from "@/store/useAppStore";
import { Brand, TeluguFont } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

// Apply Mallanna font globally to all Text and TextInput components.
// RN 0.81 + React 19: Text is a plain function component — no .render,
// no defaultProps, and Metro freezes module exports (non-configurable).
// Instead we intercept the JSX runtime factories (jsx / jsxs / jsxDEV)
// so every <Text> and <TextInput> element gets the font in its style.
(function applyGlobalFont() {
  const OrigText = Text;
  const OrigInput = TextInput;

  function wrapFactory(factory: Function) {
    return function (type: any, props: any, ...args: any[]) {
      if (type === OrigText || type === OrigInput) {
        return factory(
          type,
          { ...props, style: [{ fontFamily: TeluguFont }, props?.style] },
          ...args,
        );
      }
      return factory(type, props, ...args);
    };
  }

  // Patch dev JSX runtime (used by Metro in development)
  try {
    const rt = require("react/jsx-dev-runtime");
    if (rt.jsxDEV) rt.jsxDEV = wrapFactory(rt.jsxDEV);
  } catch {}

  // Patch production JSX runtime
  try {
    const rt = require("react/jsx-runtime");
    if (rt.jsx) rt.jsx = wrapFactory(rt.jsx);
    if (rt.jsxs) rt.jsxs = wrapFactory(rt.jsxs);
  } catch {}
})();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const hydrateUser = useUserStore((s) => s.hydrate);
  const hydrateApp = useAppStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    Mallanna: require("@/assets/fonts/Mallanna-Regular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      await Promise.all([hydrateUser(), hydrateApp()]);
      if (fontsLoaded) await SplashScreen.hideAsync();
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: Brand.primary,
          headerTitleStyle: { fontWeight: "700", fontFamily: TeluguFont },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#F5F5F7" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="article/[slug]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="category/[category]"
          options={{ title: "" }}
        />
        <Stack.Screen
          name="gallery/index"
          options={{ title: "Gallery" }}
        />
        <Stack.Screen
          name="gallery/[slug]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="video/[slug]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/login"
          options={{ title: "Sign In", presentation: "modal" }}
        />
        <Stack.Screen
          name="auth/register"
          options={{ title: "Create Account", presentation: "modal" }}
        />
        <Stack.Screen
          name="search"
          options={{ title: "Search", presentation: "modal" }}
        />
        <Stack.Screen name="about" options={{ title: "About Us", headerBackTitle: "Back" }} />
        <Stack.Screen name="contact" options={{ title: "Contact Us", headerBackTitle: "Back" }} />
        <Stack.Screen name="privacy" options={{ title: "Privacy Policy", headerBackTitle: "Back" }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
