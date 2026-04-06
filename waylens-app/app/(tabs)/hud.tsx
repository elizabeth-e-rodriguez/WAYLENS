import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Alert, Text, ScrollView } from "react-native";
import { useRideStore } from "@/components/ride/rideStore";
import { WsHudLink } from "@/components/wifi/WsHudLink";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type HudTurn = "LEFT" | "RIGHT" | "STRAIGHT";

function isValidIp(ip: string) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
}

function formatHudDistanceFeet(feet: number) {
  if (feet < 1000) return `${Math.round(feet)} ft`;
  const miles = feet / 5280;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export default function HudScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const ride = useRideStore();
  const linkRef = useRef<WsHudLink | null>(null);

  const [ip, setIp] = useState("192.168.43.50");
  const [connected, setConnected] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // temporary next-turn controls until real routing is added
  const [turn, setTurn] = useState<HudTurn>("STRAIGHT");
  const [turnDistanceFeet, setTurnDistanceFeet] = useState(350);

  const tracking = ride.tracking;
  const speedMph = Math.max(0, ride.speedMps) * 2.23694;
  const totalMi = ride.totalMeters / 1609.344;

  const nextTurnDistanceText = useMemo(
    () => formatHudDistanceFeet(turnDistanceFeet),
    [turnDistanceFeet]
  );

  const packet = useMemo(
    () => ({
      mode: "bike",
      tracking,
      speedMph: Math.round(speedMph * 10) / 10,
      rideMi: Math.round(totalMi * 100) / 100,
      turn,
      turnDistanceText: nextTurnDistanceText,

      // compact fallback fields
      m: "bike",
      s: Math.round(speedMph * 10) / 10,
      d: Math.round(totalMi * 100) / 100,
      t: turn.toLowerCase(),
      tm: nextTurnDistanceText,
      a: tracking ? "tracking" : "idle",
    }),
    [tracking, speedMph, totalMi, turn, nextTurnDistanceText]
  );

  useEffect(() => {
    if (!connected) return;

    const tmr = setInterval(() => {
      try {
        linkRef.current?.sendJson(packet);
        setLastSentAt(Date.now());
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    }, 250);

    return () => clearInterval(tmr);
  }, [connected, packet]);

  const connect = () => {
    if (!isValidIp(ip)) {
      Alert.alert("Invalid IP", "Enter a valid IPv4 address");
      return;
    }

    setError(null);
    const link = new WsHudLink();

    try {
      link.connect(ip.trim(), 81);
      linkRef.current = link;
      setConnected(true);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  };

  const disconnect = () => {
    try {
      linkRef.current?.close();
    } finally {
      linkRef.current = null;
      setConnected(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: c.text }]}>HUD</Text>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: connected ? c.tintSoft : c.surface,
              borderColor: connected ? c.tint : c.border,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: connected ? c.tint : c.muted }]}>
            {connected ? "Connected" : "Disconnected"}
          </Text>
        </View>

        <Text style={[styles.label, { color: c.text }]}>ESP32 IP</Text>

        <TextInput
          value={ip}
          onChangeText={(t) => {
            setIp(t);
            setError(null);
          }}
          placeholder="192.168.x.x"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.input,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              color: c.text,
            },
          ]}
        />

        <View style={styles.row}>
          <Pressable
            onPress={() => (connected ? disconnect() : connect())}
            style={[styles.primaryBtn, { backgroundColor: connected ? c.danger : c.tint }]}
          >
            <Text style={styles.primaryBtnText}>{connected ? "Disconnect" : "Connect"}</Text>
          </Pressable>
        </View>

        {lastSentAt ? (
          <Text style={[styles.meta, { color: c.muted }]}>
            Last sync {new Date(lastSentAt).toLocaleTimeString()}
          </Text>
        ) : null}

        {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
      </View>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Bike Status</Text>

        <View style={styles.metricRow}>
          <View style={[styles.metricBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.metricLabel, { color: c.muted }]}>Ride</Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {tracking ? "Tracking" : "Idle"}
            </Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.metricLabel, { color: c.muted }]}>Speed</Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {speedMph.toFixed(1)} mph
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={[styles.metricBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.metricLabel, { color: c.muted }]}>Distance</Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {totalMi.toFixed(2)} mi
            </Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.metricLabel, { color: c.muted }]}>Next Turn</Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {turn} • {nextTurnDistanceText}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Turn Test</Text>

        <View style={styles.row}>
          <Pressable onPress={() => setTurn("LEFT")} style={[styles.smallBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>Left</Text>
          </Pressable>
          <Pressable onPress={() => setTurn("STRAIGHT")} style={[styles.smallBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>Straight</Text>
          </Pressable>
          <Pressable onPress={() => setTurn("RIGHT")} style={[styles.smallBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>Right</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable onPress={() => setTurnDistanceFeet(150)} style={[styles.smallBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>150 ft</Text>
          </Pressable>
          <Pressable onPress={() => setTurnDistanceFeet(800)} style={[styles.smallBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>800 ft</Text>
          </Pressable>
          <Pressable onPress={() => setTurnDistanceFeet(1200)} style={[styles.smallBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>0.2 mi</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 18, gap: 14, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: "800" },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  statusPill: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  statusText: { fontSize: 12, fontWeight: "800" },
  label: { fontSize: 14, fontWeight: "700" },
  input: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, fontSize: 15 },
  row: { flexDirection: "row", gap: 10 },
  metricRow: { flexDirection: "row", gap: 10 },
  metricBox: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, gap: 6 },
  metricLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  metricValue: { fontSize: 18, fontWeight: "800" },
  primaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 18, alignItems: "center" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  smallBtn: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: "center" },
  smallBtnText: { fontSize: 13, fontWeight: "700" },
  meta: { fontSize: 13 },
  error: { fontSize: 13, fontWeight: "600" },
});