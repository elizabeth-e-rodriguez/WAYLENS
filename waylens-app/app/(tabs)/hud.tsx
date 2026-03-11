import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Alert } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRideStore } from "@/components/ride/rideStore";
import { WsHudLink } from "@/components/wifi/WsHudLink";

function isValidIp(ip: string) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255;
  });
}

export default function HudScreen() {
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
      Alert.alert("Invalid IP", "Please enter a valid IPv4 address (e.g. 192.168.0.100).");
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
    <ThemedView style={styles.container}>
      <ThemedText type="title">HUD (Wi-Fi)</ThemedText>
      <ThemedText style={styles.sub}>
        Hotspot the phone → ESP32 joins → app streams HUD packets over WebSocket.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">ESP32 IP</ThemedText>
        <TextInput
          value={ip}
          onChangeText={(t) => {
            setIp(t);
            setError(null);
          }}
          placeholder="192.168.x.x"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          style={styles.input}
        />
        <ThemedText style={styles.hint}>Check the Arduino Serial Monitor for the device IP.</ThemedText>

        <View style={styles.row}>
          <Pressable
            onPress={() => (connected ? disconnect() : connect())}
            style={[styles.btn, connected ? styles.btnConnected : styles.btnPrimary]}
            accessibilityLabel={connected ? "Disconnect from HUD" : "Connect to HUD"}
          >
            <ThemedText type="subtitle">{connected ? "Disconnect" : "Connect"}</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              // quick test: send one packet manually
              try {
                linkRef.current?.sendJson(packet);
                setLastSentAt(Date.now());
              } catch (e: any) {
                setError(String(e?.message ?? e));
              }
            }}
            style={styles.btnGhost}
            disabled={!connected}
          >
            <ThemedText type="subtitle">Send Once</ThemedText>
          </Pressable>
        </View>

        <View style={styles.statusRow}>
          <ThemedText type="subtitle">Status:</ThemedText>
          <ThemedText style={{ marginLeft: 8 }}>
            {connected ? "Connected" : "Disconnected"}
          </ThemedText>
        </View>

        <ThemedText style={styles.packet}>Packet: {JSON.stringify(packet)}</ThemedText>
        <ThemedText style={styles.small}>
          Last sent: {lastSentAt ? new Date(lastSentAt).toLocaleTimeString() : "—"}
        </ThemedText>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      </ThemedView>

      <ThemedText style={styles.sub}>
        When connected, open the Arduino Serial Monitor — the ESP32 should print incoming JSON.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 12 },
  sub: { opacity: 0.8 },

  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  statusRow: { marginTop: 10, flexDirection: "row", alignItems: "center" },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "rgba(0,122,255,0.95)",
  },
  btnConnected: {
    backgroundColor: "rgba(200,20,60,0.9)",
  },
  btnGhost: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  card: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.08)",
    backgroundColor: "transparent",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
    color: "white",
    marginTop: 8,
  },
  hint: { opacity: 0.7, fontSize: 12 },

  packet: { opacity: 0.8, fontSize: 12, marginTop: 8 },
  small: { opacity: 0.6, fontSize: 12, marginTop: 4 },
  error: { color: "#ff6666", marginTop: 6, fontSize: 13 },
});