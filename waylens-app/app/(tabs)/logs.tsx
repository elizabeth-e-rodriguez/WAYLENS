import React from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function MetricCard({
  title,
  value,
  hint,
  fullWidth,
  c,
}: {
  title: string;
  value: string;
  hint?: string;
  fullWidth?: boolean;
  c: any;
}) {
  return (
    <View
      style={[
        styles.card,
        fullWidth ? styles.cardFull : styles.cardHalf,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <Text style={[styles.cardTitle, { color: c.muted }]}>{title}</Text>
      <Text style={[styles.cardValue, { color: c.text }]}>{value}</Text>
      {hint ? <Text style={[styles.cardHint, { color: c.muted }]}>{hint}</Text> : null}
    </View>
  );
}

export default function LogsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];
  const hasLogs = false;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>Logs</Text>

        <Pressable style={[styles.headerBtn, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.headerBtnText, { color: c.tint }]}>Export</Text>
        </Pressable>
      </View>

      {!hasLogs ? (
        <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: c.tintSoft }]}>
            <Text style={[styles.emptyIconText, { color: c.tint }]}>⏱</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No activity yet</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <MetricCard title="Recent" value={hasLogs ? "1 Ride" : "—"} hint="7 days" c={c} />
        <MetricCard title="Alert" value="—" hint="Latest" c={c} />
        <MetricCard title="Distance" value="—" hint="Total" c={c} />
        <MetricCard title="Duration" value="—" hint="Time" c={c} />
      </View>

      <MetricCard fullWidth title="Export" value="CSV / PDF" hint="Share sessions" c={c} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    gap: 14,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },

  headerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerBtnText: {
    fontWeight: "800",
    fontSize: 14,
  },

  empty: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  cardHalf: {
    width: "48%",
  },
  cardFull: {
    width: "100%",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: "800",
  },
  cardHint: {
    fontSize: 13,
  },
});