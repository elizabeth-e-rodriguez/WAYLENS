import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

function Card({
  title,
  value,
  hint,
  fullWidth,
}: {
  title: string;
  value: string;
  hint?: string;
  fullWidth?: boolean;
}) {
  return (
    <ThemedView style={[styles.card, fullWidth ? styles.cardFull : styles.cardHalf]}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="title" style={styles.value}>
        {value}
      </ThemedText>
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
    </ThemedView>
  );
}

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText style={styles.sub}>
        Under construction 🚧 Pairing + HUD settings will be added soon.
      </ThemedText>

      <View style={styles.grid}>
        <Card title="Device Pairing" value="Not connected" hint="ESP32 connection later" />
        <Card title="HUD Brightness" value="—" hint="Slider control later" />
        <Card title="Safety Alerts" value="—" hint="Speed / hazard / route alerts" />
        <Card title="Units" value="—" hint="mph/kmh toggle later" />
      </View>

      <Card
        fullWidth
        title="Developer Notes"
        value="Early Build"
        hint="Settings are placeholders while WAYLENS features are being implemented."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 10 },
  sub: { opacity: 0.75, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  card: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.25)",
  },
  cardHalf: { width: "48%" },
  cardFull: { width: "100%" },

  value: { marginTop: 6 },
  hint: { opacity: 0.7, marginTop: 2, fontSize: 12, lineHeight: 16 },
});
