import React, { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const TRAVEL_LOGS_KEY = "waylens_travel_logs";

type TravelLog = {
  id: string;
  mode: "bike" | "hike";
  destination: string;
  dateLabel: string;
  timeLabel: string;
  distanceKm: number;
  durationMin: number;
  createdAt: string;
};

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
      <Text style={[styles.cardValue, { color: c.text }]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={[styles.cardHint, { color: c.muted }]}>{hint}</Text> : null}
    </View>
  );
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

export default function LogsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const [logs, setLogs] = useState<TravelLog[]>([]);

  const loadLogs = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(TRAVEL_LOGS_KEY);
      const parsed: TravelLog[] = saved ? JSON.parse(saved) : [];
      setLogs(parsed);
    } catch (error) {
      console.log("LOAD LOGS ERROR:", error);
      setLogs([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  const hasLogs = logs.length > 0;

  const recentCount = logs.length;

  const totalDistanceKm = useMemo(() => {
    return logs.reduce((sum, item) => sum + Number(item.distanceKm || 0), 0);
  }, [logs]);

  const totalDurationMin = useMemo(() => {
    return logs.reduce((sum, item) => sum + Number(item.durationMin || 0), 0);
  }, [logs]);

  const latestTrip = logs[0];

  async function clearLogs() {
    try {
      await AsyncStorage.removeItem(TRAVEL_LOGS_KEY);
      setLogs([]);
    } catch (error) {
      console.log("CLEAR LOGS ERROR:", error);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>Travel Logs</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            Saved rides and hikes from navigation
          </Text>
        </View>

        <Pressable
          onPress={clearLogs}
          style={[
            styles.headerBtn,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={[styles.headerBtnText, { color: c.tint }]}>Clear</Text>
        </Pressable>
      </View>

      {!hasLogs ? (
        <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: c.tintSoft }]}>
            <Ionicons name="trail-sign-outline" size={24} color={c.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No trips saved yet</Text>
          <Text style={[styles.emptySub, { color: c.muted }]}>
            End a ride or hike from navigation and save it here.
          </Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <MetricCard
          title="Recent"
          value={`${recentCount} ${recentCount === 1 ? "Trip" : "Trips"}`}
          hint="Saved sessions"
          c={c}
        />
        <MetricCard
          title="Latest"
          value={latestTrip ? latestTrip.mode === "bike" ? "Bike" : "Hike" : "—"}
          hint={latestTrip ? latestTrip.timeLabel : "No trip"}
          c={c}
        />
        <MetricCard
          title="Distance"
          value={hasLogs ? `${totalDistanceKm.toFixed(1)} km` : "—"}
          hint="Total"
          c={c}
        />
        <MetricCard
          title="Duration"
          value={hasLogs ? formatDuration(totalDurationMin) : "—"}
          hint="All trips"
          c={c}
        />
      </View>

      <MetricCard
        fullWidth
        title="Export"
        value="CSV / PDF"
        hint="Ready for future share feature"
        c={c}
      />

      {hasLogs ? (
        <View style={styles.listWrap}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Saved Trips</Text>

          {logs.map((item) => (
            <View
              key={item.id}
              style={[
                styles.logCard,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <View style={styles.logTopRow}>
                <View
                  style={[
                    styles.logIconWrap,
                    { backgroundColor: c.tintSoft },
                  ]}
                >
                  <Ionicons
                    name={item.mode === "bike" ? "bicycle-outline" : "walk-outline"}
                    size={18}
                    color={c.tint}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.logDestination, { color: c.text }]} numberOfLines={1}>
                    {item.destination || "Unknown destination"}
                  </Text>
                  <Text style={[styles.logMeta, { color: c.muted }]}>
                    {item.dateLabel} • {item.timeLabel}
                  </Text>
                </View>

                <View
                  style={[
                    styles.modeBadge,
                    { backgroundColor: c.surface, borderColor: c.border },
                  ]}
                >
                  <Text style={[styles.modeBadgeText, { color: c.text }]}>
                    {item.mode === "bike" ? "Bike" : "Hike"}
                  </Text>
                </View>
              </View>

              <View style={styles.logStatsRow}>
                <View
                  style={[
                    styles.logStatBox,
                    { backgroundColor: c.surface, borderColor: c.border },
                  ]}
                >
                  <Text style={[styles.logStatLabel, { color: c.muted }]}>Distance</Text>
                  <Text style={[styles.logStatValue, { color: c.text }]}>
                    {item.distanceKm.toFixed(2)} km
                  </Text>
                </View>

                <View
                  style={[
                    styles.logStatBox,
                    { backgroundColor: c.surface, borderColor: c.border },
                  ]}
                >
                  <Text style={[styles.logStatLabel, { color: c.muted }]}>Duration</Text>
                  <Text style={[styles.logStatValue, { color: c.text }]}>
                    {formatDuration(item.durationMin)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 16,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
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
    fontSize: 24,
    fontWeight: "800",
  },
  cardHint: {
    fontSize: 13,
  },

  listWrap: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  logCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  logTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logDestination: {
    fontSize: 16,
    fontWeight: "800",
  },
  logMeta: {
    marginTop: 2,
    fontSize: 13,
  },
  modeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  logStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  logStatBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  logStatLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  logStatValue: {
    fontSize: 16,
    fontWeight: "800",
  },
});