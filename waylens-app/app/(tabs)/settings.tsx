import React, { useState } from "react";
import { StyleSheet, View, Switch, Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeMode, ThemeMode } from "@/components/theme/ThemeMode";

function Row({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <ThemedText type="subtitle">{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.subText}>{subtitle}</ThemedText> : null}
      </View>
      {right}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ThemedView style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </ThemedView>
  );
}

export default function SettingsScreen() {
  const [metricUnits, setMetricUnits] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState(true);

  const { mode, setMode } = useThemeMode();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText style={styles.sub}>These are early settings placeholders for the MVP.</ThemedText>

      <Section title="Appearance">
        <Row
          title="Theme"
          subtitle="System, Light, or Dark"
          right={
            <View style={styles.themeRow}>
              {(["system", "light", "dark"] as ThemeMode[]).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[styles.themeBtn, active && styles.themeBtnActive]}
                  >
                    <ThemedText type="subtitle">
                      {m === "system" ? "System" : m === "light" ? "Light" : "Dark"}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          }
        />
      </Section>

      <Section title="Device">
        <Row
          title="HUD Connection"
          subtitle="Wi-Fi / BLE pairing status"
          right={
            <Pressable style={styles.pill} onPress={() => {}}>
              <ThemedText type="subtitle">Not Connected</ThemedText>
            </Pressable>
          }
        />
        <View style={styles.divider} />
        <Row
          title="HUD Brightness"
          subtitle="Adjust display brightness"
          right={
            <Pressable style={styles.pillGhost} onPress={() => {}}>
              <ThemedText type="subtitle">Soon</ThemedText>
            </Pressable>
          }
        />
      </Section>

      <Section title="Safety">
        <Row
          title="Safety Alerts"
          subtitle="Speed / hazard alerts (later)"
          right={<Switch value={safetyAlerts} onValueChange={setSafetyAlerts} />}
        />
      </Section>

      <Section title="Preferences">
        <Row
          title="Units"
          subtitle={metricUnits ? "km/h, km" : "mph, mi"}
          right={<Switch value={metricUnits} onValueChange={setMetricUnits} />}
        />
        <View style={styles.divider} />
        <Row
          title="Developer Mode"
          subtitle="Show debug data"
          right={
            <Pressable style={styles.pillGhost} onPress={() => {}}>
              <ThemedText type="subtitle">Soon</ThemedText>
            </Pressable>
          }
        />
      </Section>
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

  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  subText: { opacity: 0.75, fontSize: 12, marginTop: 2 },

  divider: { height: 1, backgroundColor: "rgba(120,120,120,0.12)" },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
  },
  pillGhost: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.10)",
  },

  themeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.10)",
  },
  themeBtnActive: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(120,120,120,0.25)",
  },
});