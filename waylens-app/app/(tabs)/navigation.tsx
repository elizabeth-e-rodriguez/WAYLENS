import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRideStore } from "@/components/ride/rideStore";

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="title" style={styles.value}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

export default function NavigationScreen() {
  const mapRef = useRef<MapView>(null);
  const { permission, tracking, current, path, speedMps, totalMeters, start, stop } =
    useRideStore();

  const speedKph = useMemo(() => Math.max(0, speedMps) * 3.6, [speedMps]);
  const distKm = useMemo(() => totalMeters / 1000, [totalMeters]);

  useEffect(() => {
    if (!current) return;
    mapRef.current?.animateCamera({
      center: current,
      zoom: 17,
      pitch: 45,
      heading: 0,
    });
  }, [current?.latitude, current?.longitude]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Cycling Navigation</ThemedText>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          showsUserLocation
          followsUserLocation
          showsMyLocationButton
        >
          {path.length >= 2 && <Polyline coordinates={path} strokeWidth={6} />}
        </MapView>

        {/* Top overlay */}
        <View style={styles.overlayTop}>
          <ThemedText style={styles.overlayText}>
            GPS: {permission === "granted" ? "OK" : permission === "denied" ? "Denied" : "—"}
          </ThemedText>
          <ThemedText style={styles.overlayText}>
            {tracking ? "Tracking ON" : "Tracking OFF"}
          </ThemedText>
        </View>

        {/* Bottom overlay controls */}
        <View style={styles.overlayBottom}>
          <Pressable onPress={tracking ? stop : start} style={styles.btn}>
            <ThemedText type="subtitle">{tracking ? "Stop Ride" : "Start Ride"}</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              // Placeholder: destination + route planning later
            }}
            style={styles.btnGhost}
          >
            <ThemedText type="subtitle">Set Destination</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard title="Speed" value={`${speedKph.toFixed(1)} km/h`} />
        <StatCard title="Distance" value={`${distKm.toFixed(2)} km`} />
        <StatCard title="Next Turn" value={"—"} />
        <StatCard title="Turn In" value={"—"} />
      </View>

      <ThemedText style={styles.sub}>
        Next: route API + turn-by-turn steps → send arrows + distance to HUD.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 10 },
  sub: { opacity: 0.75 },

  mapWrap: {
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.25)",
  },

  overlayTop: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayText: { color: "white", fontSize: 12, opacity: 0.9 },

  overlayBottom: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 10,
  },
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

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  card: {
    width: "48%",
    borderRadius: 18,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.25)",
  },
  value: { marginTop: 6 },
});