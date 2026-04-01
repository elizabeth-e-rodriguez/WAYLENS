import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Alert, Text, ScrollView } from "react-native";
import { useRideStore } from "@/components/ride/rideStore";
import { WsHudLink } from "@/components/wifi/WsHudLink";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function isValidIp(ip: string) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
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

  const speedKph = Math.max(0, ride.speedMps) * 3.6;
  const distKm = ride.totalMeters / 1000;

  const packet = useMemo(
    () => ({
      m: "cyc",
      s: Math.round(speedKph * 10) / 10,
      d: Math.round(distKm * 100) / 100,
      t: "none",
      tm: null,
      a: "none",
      al: 0,
    }),
    [speedKph, distKm]
  );

  useEffect(() => {
    if (!connected) return;

    const t = setInterval(() => {
      try {
        linkRef.current?.sendJson(packet);
        setLastSentAt(Date.now());
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    }, 250);

    return () => clearInterval(t);
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

  const sendOnce = () => {
    try {
      linkRef.current?.sendJson(packet);
      setLastSentAt(Date.now());
    } catch (e: any) {
      setError(String(e?.message ?? e));
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

          <Pressable
            onPress={sendOnce}
            style={[
              styles.secondaryBtn,
              { backgroundColor: c.surface, borderColor: c.border, opacity: connected ? 1 : 0.5 },
            ]}
            disabled={!connected}
          >
            <Text style={[styles.secondaryBtnText, { color: c.text }]}>Send Once</Text>
          </Pressable>
        </View>

        {lastSentAt ? (
          <Text style={[styles.meta, { color: c.muted }]}>
            Last sync {new Date(lastSentAt).toLocaleTimeString()}
          </Text>
        ) : null}

        {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 18,
    gap: 14,
    paddingBottom: 120,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },

  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
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

  row: {
    flexDirection: "row",
    gap: 10,
  },

  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontWeight: "700",
    fontSize: 14,
  },

  meta: {
    fontSize: 13,
  },
  error: {
    fontSize: 13,
    fontWeight: "600",
  },
});