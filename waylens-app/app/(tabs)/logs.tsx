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

export default function LogsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Logs</ThemedText>
      <ThemedText style={styles.sub}>
        Under construction 🚧 Activity history + exports will be added soon.
      </ThemedText>

      <View style={styles.grid}>
        <Card title="Recent Activity" value="No logs yet" hint="Your rides/hikes will appear here" />
        <Card title="Last Alert" value="—" hint="Hazards / speed / battery alerts later" />
        <Card title="Total Distance" value="—" hint="Weekly / monthly totals later" />
        <Card title="Duration" value="—" hint="Time tracking later" />
      </View>

      <Card
        fullWidth
        title="Export"
        value="Coming soon"
        hint="Export logs to CSV/PDF and share your session summaries."
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
