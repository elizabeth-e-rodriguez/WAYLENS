import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Pressable, TextInput } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRideStore } from "@/components/ride/rideStore";
import { WsHudLink } from "@/components/wifi/WsHudLink";

export default function HudScreen() {
  const ride = useRideStore();

  const linkRef = useRef<WsHudLink | null>(null);
  const [ip, setIp] = useState("192.168.43.50"); // <-- change to ESP32 IP shown in Serial
  const [connected, setConnected] = useState(false);

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

  // Stream packets at 4 Hz while connected
  useEffect(() => {
    if (!connected) return;

    const t = setInterval(() => {
      linkRef.current?.sendJson(packet);
    }, 250);

    return () => clearInterval(t);
  }, [connected, packet]);

  const connect = () => {
    const link = new WsHudLink();
    link.connect(ip, 81);
    linkRef.current = link;
    setConnected(true);
  };

  const disconnect = () => {
    linkRef.current?.close();
    linkRef.current = null;
    setConnected(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">HUD (Wi-Fi)</ThemedText>
      <ThemedText style={styles.sub}>
        Phone hotspot → ESP32 joins → app sends HUD packets over WebSocket.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">ESP32 IP</ThemedText>
        <TextInput
          value={ip}
          onChangeText={setIp}
          placeholder="192.168.x.x"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          style={styles.input}
        />
        <ThemedText style={styles.hint}>Use the IP printed in Arduino Serial Monitor.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.preview}>
        <ThemedText type="subtitle">Preview</ThemedText>
        <ThemedText type="title" style={{ marginTop: 10 }}>
          {speedKph.toFixed(1)} km/h
        </ThemedText>
        <ThemedText style={{ opacity: 0.8, marginTop: 6 }}>
          Distance: {distKm.toFixed(2)} km
        </ThemedText>
        <ThemedText style={styles.packet}>Packet: {JSON.stringify(packet)}</ThemedText>
      </ThemedView>

      <View style={styles.row}>
        <Pressable
          onPress={() => (ride.tracking ? ride.stop() : ride.start())}
          style={styles.btn}
        >
          <ThemedText type="subtitle">{ride.tracking ? "Stop Ride" : "Start Ride"}</ThemedText>
        </Pressable>

        <Pressable onPress={() => (connected ? disconnect() : connect())} style={styles.btnGhost}>
          <ThemedText type="subtitle">{connected ? "Disconnect" : "Connect"}</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={styles.sub}>
        Once connected, open Arduino Serial Monitor — you should see the JSON packets printing.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 12 },
  sub: { opacity: 0.75 },

  row: { flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  card: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.25)",
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.25)",
    color: "white",
  },
  hint: { opacity: 0.7, fontSize: 12 },

  preview: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.25)",
  },
  packet: { opacity: 0.55, fontSize: 11, marginTop: 6 },
});