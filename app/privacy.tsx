import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppStore } from "@/store/useAppStore";
import { Colors, FontSize, Radius, Spacing, Shadow } from "@/constants/theme";

export default function PrivacyScreen() {
  const lang = useAppStore((s) => s.language);
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: lang === "te" ? "సమాచార సేకరణ" : "Information Collection",
      content: lang === "te"
        ? "మేము మీరు మా సేవలను ఉపయోగించినప్పుడు కొన్ని సమాచారాన్ని సేకరిస్తాము, ఇందులో మీ పేరు, ఇమెయిల్ చిరునామా, మరియు ఉపయోగ డేటా ఉన్నాయి. ఈ సమాచారం మీ అనుభవాన్ని మెరుగుపరచడానికి మాత్రమే ఉపయోగించబడుతుంది."
        : "We collect certain information when you use our services, including your name, email address, and usage data. This information is used solely to improve your experience.",
    },
    {
      title: lang === "te" ? "సమాచార ఉపయోగం" : "Use of Information",
      content: lang === "te"
        ? "మేము సేకరించిన సమాచారాన్ని సేవలను అందించడానికి, మెరుగుపరచడానికి, మరియు వ్యక్తిగతీకరించడానికి ఉపయోగిస్తాము. మేము మీ వ్యక్తిగత సమాచారాన్ని మీ అనుమతి లేకుండా మూడవ పక్షాలకు విక్రయించము లేదా పంచుకోము."
        : "We use the collected information to provide, improve, and personalize our services. We do not sell or share your personal information with third parties without your consent.",
    },
    {
      title: lang === "te" ? "డేటా భద్రత" : "Data Security",
      content: lang === "te"
        ? "మేము మీ వ్యక్తిగత సమాచారాన్ని రక్షించడానికి పరిశ్రమ ప్రమాణ భద్రతా చర్యలను అమలు చేస్తాము. అయినప్పటికీ, ఇంటర్నెట్ ద్వారా ప్రసారం చేయడం లేదా ఎలక్ట్రానిక్ నిల్వ పద్ధతి 100% సురక్షితం కాదు."
        : "We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.",
    },
    {
      title: lang === "te" ? "కుకీలు" : "Cookies",
      content: lang === "te"
        ? "మేము మీ అనుభవాన్ని మెరుగుపరచడానికి కుకీలు మరియు సమానమైన సాంకేతిక పరిజ్ఞానాలను ఉపయోగిస్తాము. మీరు మీ బ్రౌజర్ సెట్టింగ్‌ల ద్వారా కుకీలను నిరాకరించవచ్చు."
        : "We use cookies and similar technologies to enhance your experience. You may opt out of cookies through your browser settings.",
    },
    {
      title: lang === "te" ? "మార్పులు" : "Changes to Policy",
      content: lang === "te"
        ? "మేము ఈ గోప్యతా విధానాన్ని ఎప్పుడైనా నవీకరించవచ్చు. మార్పులు జరిగినప్పుడు మేము మిమ్మల్ని ఈ పేజీలో తెలియజేస్తాము."
        : "We may update this privacy policy at any time. Changes will be posted on this page when they occur.",
    },
    {
      title: lang === "te" ? "మమ్మల్ని సంప్రదించండి" : "Contact Us",
      content: lang === "te"
        ? "ఈ గోప్యతా విధానం గురించి మీకు ఏవైనా ప్రశ్నలు ఉంటే, దయచేసి మా సంప్రదింపు పేజీ ద్వారా మమ్మల్ని సంప్రదించండి."
        : "If you have any questions about this privacy policy, please contact us through our contact page.",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>
        {lang === "te" ? "గోప్యతా విధానం" : "Privacy Policy"}
      </Text>
      <Text style={styles.lastUpdated}>
        {lang === "te" ? "చివరిగా నవీకరించబడింది: 2025" : "Last updated: 2025"}
      </Text>

      {sections.map((section, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      ))}

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
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  lastUpdated: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    marginBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
});
