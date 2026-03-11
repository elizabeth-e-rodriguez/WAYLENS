import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

function LinkCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Pressable onPress={() => {}} style={styles.linkCard}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText style={styles.linkSub}>{subtitle}</ThemedText>
    </Pressable>
  );
}

export default function ExploreScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Resources</ThemedText>
      <ThemedText style={styles.sub}>
        Helpful links and notes while building the WAYLENS MVP.
      </ThemedText>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>MVP Checklist</ThemedText>
        <View style={styles.bullets}>
          <ThemedText style={styles.bullet}>• App → ESP32 connection stable</ThemedText>
          <ThemedText style={styles.bullet}>• Cycling mode: speed + simple direction</ThemedText>
          <ThemedText style={styles.bullet}>• HUD shows updates in real-time</ThemedText>
          <ThemedText style={styles.bullet}>• Waypoints (hard-coded) working</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Docs</ThemedText>
        <LinkCard title="Expo Router" subtitle="Navigation + file-based routing reference" />
        <LinkCard title="Location / GPS" subtitle="expo-location usage patterns" />
        <LinkCard title="WebSocket HUD" subtitle="Packet structure + send interval notes" />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
        <ThemedText style={styles.note}>
          Web is used for quick UI testing. Native-only modules (like maps) should be loaded only
          on device/emulator.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 12 },
  sub: { opacity: 0.8, fontSize: 13 },

  section: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
    backgroundColor: "transparent",
  },
  sectionTitle: { opacity: 0.75, fontSize: 12, letterSpacing: 0.4 },

  bullets: { gap: 6, marginTop: 4 },
  bullet: { opacity: 0.9, fontSize: 13 },

  linkCard: {
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.10)",
  },
  linkSub: { opacity: 0.75, fontSize: 12 },

  note: { opacity: 0.85, fontSize: 13, lineHeight: 18 },
});