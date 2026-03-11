import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
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
  const mapRef = useRef<any>(null);
  const { permission, tracking, current, path, speedMps, totalMeters, start, stop } =
    useRideStore();

  const speedKph = useMemo(() => Math.max(0, speedMps) * 3.6, [speedMps]);
  const distKm = useMemo(() => totalMeters / 1000, [totalMeters]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!current) return;
    try {
      mapRef.current?.animateCamera?.({
        center: current,
        zoom: 17,
        pitch: 45,
        heading: 0,
      });
    } catch (e) {
      // ignore if not available yet
    }
  }, [current?.latitude, current?.longitude]);

  // runtime require for native-only module
  let MapViewNative: any = null;
  let PolylineNative: any = null;
  if (Platform.OS !== "web") {
    const maps = require("react-native-maps");
    MapViewNative = maps.default ?? maps.MapView ?? maps;
    PolylineNative = maps.Polyline;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Cycling Navigation</ThemedText>

      <View style={styles.mapWrap}>
        {Platform.OS === "web" ? (
          <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
            <ThemedText type="subtitle">Map unavailable on web</ThemedText>
            <ThemedText style={{ marginTop: 8, opacity: 0.85, fontSize: 12 }}>
              Use an Android/iOS device or emulator to test full map features.
            </ThemedText>
          </View>
        ) : (
          MapViewNative && (
            <MapViewNative
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              showsUserLocation
              followsUserLocation
              showsMyLocationButton
            >
              {path.length >= 2 && PolylineNative && (
                <PolylineNative coordinates={path} strokeWidth={6} />
              )}
            </MapViewNative>
          )
        )}

        <View style={styles.overlayTop}>
          <ThemedText style={styles.overlayText}>
            GPS: {permission === "granted" ? "OK" : permission === "denied" ? "Denied" : "—"}
          </ThemedText>
          <ThemedText style={styles.overlayText}>
            {tracking ? "Tracking ON" : "Tracking OFF"}
          </ThemedText>
        </View>

        <View style={styles.overlayBottom}>
          <Pressable onPress={tracking ? stop : start} style={styles.btn}>
            <ThemedText type="subtitle">{tracking ? "Stop Ride" : "Start Ride"}</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              /* placeholder for set destination */
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
        Next: route API + turn-by-turn steps → send arrows & distance to HUD.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 10 },
  sub: { opacity: 0.8, fontSize: 13 },

  mapWrap: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
    backgroundColor: "#111", // fallback color for map area
  },

  webPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  overlayTop: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayText: { color: "white", fontSize: 12, opacity: 0.95 },

  overlayBottom: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  card: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(120,120,120,0.12)",
    backgroundColor: "transparent",
  },
  value: { marginTop: 6 },
});