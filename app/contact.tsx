import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { submitContact } from "@/lib/requests";
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ContactScreen() {
  const lang = useAppStore((s) => s.language);
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert(
        lang === "te" ? "దోషం" : "Error",
        lang === "te" ? "అన్ని ఫీల్డ్‌లు అవసరం" : "All fields are required"
      );
      return;
    }

    setLoading(true);
    try {
      await submitContact({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      });

      Alert.alert(
        lang === "te" ? "విజయం" : "Success",
        lang === "te"
          ? "మీ సందేశం విజయవంతంగా పంపబడింది!"
          : "Your message has been sent successfully!"
      );

      setFullName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (lang === "te"
          ? "పంపడం విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి."
          : "Failed to send. Please try again later.");
      Alert.alert(lang === "te" ? "దోషం" : "Error", msg);
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <Ionicons name="mail" size={32} color={Brand.primary} />
          </View>
          <Text style={styles.introTitle}>
            {lang === "te" ? "మమ్మల్ని సంప్రదించండి" : "Get In Touch"}
          </Text>
          <Text style={styles.introText}>
            {lang === "te"
              ? "మీ ప్రశ్నలు, సలహాలు లేదా ఫీడ్‌బ్యాక్ పంపండి"
              : "Send us your questions, suggestions, or feedback"}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{lang === "te" ? "పేరు" : "Name"}</Text>
            <TextInput
              style={styles.input}
              placeholder={lang === "te" ? "మీ పేరు" : "Your name"}
              placeholderTextColor={Colors.light.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{lang === "te" ? "ఇమెయిల్" : "Email"}</Text>
            <TextInput
              style={styles.input}
              placeholder={lang === "te" ? "మీ ఇమెయిల్" : "Your email"}
              placeholderTextColor={Colors.light.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{lang === "te" ? "విషయం" : "Subject"}</Text>
            <TextInput
              style={styles.input}
              placeholder={lang === "te" ? "సబ్జెక్ట్" : "Subject"}
              placeholderTextColor={Colors.light.textMuted}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{lang === "te" ? "సందేశం" : "Message"}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={lang === "te" ? "మీ సందేశం..." : "Your message..."}
              placeholderTextColor={Colors.light.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>
              {loading
                ? lang === "te" ? "పంపుతోంది..." : "Sending..."
                : lang === "te" ? "పంపండి" : "Send Message"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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

  introSection: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Brand.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  introTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.light.text,
  },
  introText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
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
  input: {
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    height: 50,
    fontSize: FontSize.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 130,
    paddingTop: Spacing.md,
  },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Brand.primary,
    height: 52,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#fff",
  },
});
