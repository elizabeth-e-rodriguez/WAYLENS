import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

function MetricCard({
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
  const hasLogs = false; // wire to real logs later

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Logs</ThemedText>
        <Pressable
          onPress={() => {
            // later: export to CSV/PDF
          }}
          style={styles.headerBtn}
        >
          <ThemedText type="subtitle">Export</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={styles.sub}>
        Session history, alerts, and exports will appear here.
      </ThemedText>

      {!hasLogs ? (
        <ThemedView style={styles.empty}>
          <ThemedText type="subtitle">No activity yet</ThemedText>
          <ThemedText style={styles.emptySub}>
            Start a ride to generate your first session log.
          </ThemedText>
        </ThemedView>
      ) : null}

      <View style={styles.grid}>
        <MetricCard title="Recent Activity" value={hasLogs ? "1 Ride" : "—"} hint="Last 7 days" />
        <MetricCard title="Last Alert" value="—" hint="Safety alerts later" />
        <MetricCard title="Total Distance" value="—" hint="Weekly totals later" />
        <MetricCard title="Duration" value="—" hint="Time tracking later" />
      </View>

      <MetricCard
        fullWidth
        title="Export Formats"
        value="CSV / PDF"
        hint="Export session summaries for sharing and reports."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 12 },
  sub: { opacity: 0.8, fontSize: 13 },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
  },

  empty: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  emptySub: { opacity: 0.75, fontSize: 13 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  card: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
    backgroundColor: "transparent",
  },
  cardHalf: { width: "48%" },
  cardFull: { width: "100%" },

  value: { marginTop: 6 },
  hint: { opacity: 0.7, marginTop: 2, fontSize: 12, lineHeight: 16 },
});