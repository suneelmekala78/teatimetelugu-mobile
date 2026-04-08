import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

import { useUserStore } from "@/store/useUserStore";
import { useAppStore } from "@/store/useAppStore";
import { loginUser, googleAuth } from "@/lib/requests";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const lang = useAppStore((s) => s.language);
  const login = useUserStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: "teatimetelugu",
    path: "auth",
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const res = await googleAuth({ idToken });
      const { accessToken, user, refreshToken } = res.data;
      await login(user, accessToken, refreshToken);
      router.back();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (lang === "te"
          ? "Google లాగిన్ విఫలమైంది"
          : "Google login failed. Please try again.");
      Alert.alert(lang === "te" ? "దోషం" : "Error", message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        lang === "te" ? "దోషం" : "Error",
        lang === "te"
          ? "ఇమెయిల్ మరియు పాస్‌వర్డ్ అవసరం"
          : "Email and password are required"
      );
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      const { accessToken, user } = res.data;
      const refreshToken = res.data.refreshToken;

      await login(user, accessToken, refreshToken);
      router.back();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (lang === "te"
          ? "లాగిన్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి."
          : "Login failed. Please check your credentials.");
      Alert.alert(lang === "te" ? "దోషం" : "Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.appName}>Tea Time Telugu</Text>
          <Text style={styles.subtitle}>
            {lang === "te"
              ? "మీ ఖాతాలోకి సైన్ ఇన్ చేయండి"
              : "Sign in to your account"}
          </Text>
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
          onPress={() => promptAsync()}
          disabled={!request || googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color={Colors.light.text} />
          ) : (
            <>
              <Image
                source={{
                  uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                }}
                style={styles.googleIcon}
                contentFit="contain"
              />
              <Text style={styles.googleBtnText}>
                {lang === "te"
                  ? "Google తో సైన్ ఇన్ చేయండి"
                  : "Sign in with Google"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>
            {lang === "te" ? "లేదా" : "OR"}
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {lang === "te" ? "ఇమెయిల్" : "Email"}
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={Colors.light.textMuted} />
              <TextInput
                style={styles.input}
                placeholder={lang === "te" ? "ఇమెయిల్ ఎంటర్ చేయండి" : "Enter your email"}
                placeholderTextColor={Colors.light.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {lang === "te" ? "పాస్‌వర్డ్" : "Password"}
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textMuted} />
              <TextInput
                style={styles.input}
                placeholder={lang === "te" ? "పాస్‌వర్డ్ ఎంటర్ చేయండి" : "Enter your password"}
                placeholderTextColor={Colors.light.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.light.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>
              {loading
                ? lang === "te"
                  ? "సైన్ ఇన్ చేస్తోంది..."
                  : "Signing in..."
                : lang === "te"
                ? "సైన్ ఇన్"
                : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {lang === "te" ? "ఖాతా లేదా? " : "Don't have an account? "}
          </Text>
          <Link href="/auth/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>
                {lang === "te" ? "రిజిస్టర్ చేయండి" : "Register"}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
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
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },

  // Google
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: "#fff",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.light.text,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.light.textMuted,
  },

  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.text,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },

  loginBtn: {
    backgroundColor: Brand.primary,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#fff",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xxl,
  },
  footerText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
  footerLink: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Brand.primary,
  },
});
