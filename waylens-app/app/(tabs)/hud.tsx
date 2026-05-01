import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Alert,
  Text,
  ScrollView,
} from "react-native";

import { useRideStore } from "@/components/ride/rideStore";
import { WsHudLink } from "@/components/wifi/WsHudLink";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";

type HudTurn = "LEFT" | "RIGHT" | "STRAIGHT";
type HudMode = "bike" | "hike";

function isValidIp(ip: string) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;

  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
}

function turnArrow(turn: HudTurn) {
  if (turn === "LEFT") return "←";
  if (turn === "RIGHT") return "→";
  return "↑";
}

export default function HudScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const ride = useRideStore();
  const linkRef = useRef<WsHudLink | null>(null);

  const [ip, setIp] = useState("10.0.0.56");
  const [connected, setConnected] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<HudMode>(
    ((global as any).__waylensMode ?? "bike") as HudMode
  );

  const [turn, setTurn] = useState<HudTurn>(
    ((global as any).__waylensTurn ?? "STRAIGHT") as HudTurn
  );
  const [nextTurnDistanceText, setNextTurnDistanceText] = useState<string>(
    (global as any).__waylensTurnDistanceText ?? "—"
  );
  const [nextInstruction, setNextInstruction] = useState<string>(
    (global as any).__waylensRouteInstruction ?? "No route loaded"
  );
  const [elevationText, setElevationText] = useState<string>(
    (global as any).__waylensElevationText ?? "flat"
  );

  const tracking = ride.tracking;
  const speedMph = Math.max(0, ride.speedMps) * 2.23694;
  const totalMi = ride.totalMeters / 1609.344;

  useEffect(() => {
    const id = setInterval(() => {
      const nextMode = ((global as any).__waylensMode ?? "bike") as HudMode;
      const nextTurn = ((global as any).__waylensTurn ?? "STRAIGHT") as HudTurn;
      const nextDistance = (global as any).__waylensTurnDistanceText ?? "—";
      const nextRouteInstruction =
        (global as any).__waylensRouteInstruction ?? "No route loaded";
      const nextElevation =
        (global as any).__waylensElevationText ?? "flat";

      setMode((prev) => (prev !== nextMode ? nextMode : prev));
      setTurn((prev) => (prev !== nextTurn ? nextTurn : prev));
      setNextTurnDistanceText((prev) =>
        prev !== nextDistance ? nextDistance : prev
      );
      setNextInstruction((prev) =>
        prev !== nextRouteInstruction ? nextRouteInstruction : prev
      );
      setElevationText((prev) =>
        prev !== nextElevation ? nextElevation : prev
      );
    }, 300);

    return () => clearInterval(id);
  }, []);

  const packet = useMemo(
    () => ({
      mode,
      tracking,
      speedMph: Math.round(speedMph * 10) / 10,
      rideMi: Math.round(totalMi * 100) / 100,
      turn,
      turnDistanceText: nextTurnDistanceText,
      elevationText,

      m: mode,
      s: Math.round(speedMph * 10) / 10,
      d: Math.round(totalMi * 100) / 100,
      t: turn.toLowerCase(),
      tm: nextTurnDistanceText,
      el: elevationText,
      a: tracking ? "tracking" : "idle",
    }),
    [
      mode,
      tracking,
      speedMph,
      totalMi,
      turn,
      nextTurnDistanceText,
      elevationText,
    ]
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

    try {
      const link = new WsHudLink();
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

  const onSelectMode = (nextMode: HudMode) => {
    setMode(nextMode);
    (global as any).__waylensMode = nextMode;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>HUD Control</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            Connect to your glasses and send live ride guidance
          </Text>
        </View>

        <View
          style={[
            styles.topStatusPill,
            {
              backgroundColor: connected ? c.tintSoft : c.surface,
              borderColor: connected ? c.tint : c.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: connected ? c.tint : c.muted },
            ]}
          />
          <Text
            style={[
              styles.topStatusText,
              { color: connected ? c.tint : c.muted },
            ]}
          >
            {connected ? "Live" : "Offline"}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Connect to ESP32
        </Text>
        <Text style={[styles.helperText, { color: c.muted }]}>
          Enter the IP address shown by your ESP32 device.
        </Text>

        <Text style={[styles.label, { color: c.text }]}>ESP32 Address</Text>

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

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => (connected ? disconnect() : connect())}
            style={[
              styles.primaryBtn,
              { backgroundColor: connected ? c.danger : c.tint },
            ]}
          >
            <Ionicons
              name={connected ? "power-outline" : "wifi-outline"}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.primaryBtnText}>
              {connected ? "Disconnect" : "Connect"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setIp("10.0.0.56");
              setError(null);
            }}
            style={[
              styles.secondaryBtn,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.secondaryBtnText, { color: c.text }]}>
              Use Default
            </Text>
          </Pressable>
        </View>

        {lastSentAt ? (
          <Text style={[styles.meta, { color: c.muted }]}>
            Last sync {new Date(lastSentAt).toLocaleTimeString()}
          </Text>
        ) : (
          <Text style={[styles.meta, { color: c.muted }]}>
            No data sent yet
          </Text>
        )}

        {error ? (
          <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
        ) : null}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>Mode</Text>

        <View style={styles.segmentWrap}>
          <Pressable
            onPress={() => onSelectMode("bike")}
            style={[
              styles.segmentBtn,
              {
                backgroundColor: mode === "bike" ? c.tint : c.surface,
                borderColor: mode === "bike" ? c.tint : c.border,
              },
            ]}
          >
            <Ionicons
              name="bicycle-outline"
              size={18}
              color={mode === "bike" ? "#FFFFFF" : c.text}
            />
            <Text
              style={[
                styles.segmentText,
                { color: mode === "bike" ? "#FFFFFF" : c.text },
              ]}
            >
              Bike
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onSelectMode("hike")}
            style={[
              styles.segmentBtn,
              {
                backgroundColor: mode === "hike" ? c.tint : c.surface,
                borderColor: mode === "hike" ? c.tint : c.border,
              },
            ]}
          >
            <Ionicons
              name="walk-outline"
              size={18}
              color={mode === "hike" ? "#FFFFFF" : c.text}
            />
            <Text
              style={[
                styles.segmentText,
                { color: mode === "hike" ? "#FFFFFF" : c.text },
              ]}
            >
              Hike
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <View style={styles.previewHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            OLED Preview
          </Text>
          <Text style={[styles.previewModeText, { color: c.muted }]}>
            {mode === "hike" ? "Hike HUD" : "Bike HUD"}
          </Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>
            {mode === "hike" ? "Trail Cue" : "Next Turn"}
          </Text>

          <Text style={styles.previewArrow}>{turnArrow(turn)}</Text>

          <Text style={styles.previewDistance}>{nextTurnDistanceText}</Text>

          <Text style={styles.previewMain}>
            {mode === "hike" ? elevationText : turn}
          </Text>

          <Text style={styles.previewInstruction} numberOfLines={2}>
            {nextInstruction}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Ride Status
        </Text>

        <View style={styles.metricRow}>
          <View
            style={[
              styles.metricBox,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: c.muted }]}>
              Ride Status
            </Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {tracking ? "Tracking" : "Idle"}
            </Text>
          </View>

          <View
            style={[
              styles.metricBox,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: c.muted }]}>Mode</Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {mode === "hike" ? "Hike" : "Bike"}
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View
            style={[
              styles.metricBox,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: c.muted }]}>
              {mode === "hike" ? "Terrain" : "Speed"}
            </Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {mode === "hike" ? elevationText : `${speedMph.toFixed(1)} mph`}
            </Text>
          </View>

          <View
            style={[
              styles.metricBox,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: c.muted }]}>
              Distance
            </Text>
            <Text style={[styles.metricValue, { color: c.text }]}>
              {totalMi.toFixed(2)} mi
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.nextCueCard,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: c.muted }]}>Next Cue</Text>
          <Text style={[styles.nextCueValue, { color: c.text }]}>
            {turn.toLowerCase()} • {nextTurnDistanceText}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 120,
  },
  header: {
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
    lineHeight: 20,
  },
  topStatusPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  topStatusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontWeight: "800",
    fontSize: 14,
  },
  segmentWrap: {
    flexDirection: "row",
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  segmentText: {
    fontWeight: "800",
    fontSize: 14,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewModeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  previewCard: {
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewArrow: {
    color: "#FFFFFF",
    fontSize: 58,
    fontWeight: "900",
    lineHeight: 64,
  },
  previewDistance: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  previewMain: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  previewInstruction: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 2,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  nextCueCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  nextCueValue: {
    fontSize: 17,
    fontWeight: "800",
  },
  meta: {
    fontSize: 13,
  },
  error: {
    fontSize: 13,
    fontWeight: "600",
  },
});