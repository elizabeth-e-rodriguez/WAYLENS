import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Text,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { useRideStore } from "@/components/ride/rideStore";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function StatCard({
  value,
  label,
  c,
}: {
  value: string;
  label: string;
  c: any;
}) {
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.value, { color: c.text }]}>{value}</Text>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

export default function NavigationScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const mapRef = useRef<any>(null);
  const { permission, tracking, current, path, speedMps, totalMeters, start, stop } =
    useRideStore();

  const [targetLocation, setTargetLocation] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchingDestination, setSearchingDestination] = useState(false);

  const speedKph = useMemo(() => Math.max(0, speedMps) * 3.6, [speedMps]);
  const distKm = useMemo(() => totalMeters / 1000, [totalMeters]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!current) return;

    if (current && destinationCoords) {
      try {
        mapRef.current?.fitToCoordinates?.([current, destinationCoords], {
          edgePadding: { top: 100, right: 60, bottom: 100, left: 60 },
          animated: true,
        });
      } catch {}
      return;
    }

    try {
      mapRef.current?.animateCamera?.({
        center: current,
        zoom: 16,
        pitch: 0,
        heading: 0,
      });
    } catch {}
  }, [current?.latitude, current?.longitude, destinationCoords]);

  async function searchDestination() {
    if (!targetLocation.trim()) {
      Alert.alert("Destination", "Enter a place first.");
      return;
    }

    try {
      setSearchingDestination(true);
      const results = await Location.geocodeAsync(targetLocation.trim());

      if (!results.length) {
        Alert.alert("Not found", "Try a more specific place.");
        setDestinationCoords(null);
        return;
      }

      const first = results[0];
      setDestinationCoords({
        latitude: first.latitude,
        longitude: first.longitude,
      });
    } catch (error) {
      Alert.alert("Search failed", "Could not find that destination.");
      setDestinationCoords(null);
    } finally {
      setSearchingDestination(false);
    }
  }

  let MapViewNative: any = null;
  let PolylineNative: any = null;
  let MarkerNative: any = null;

  if (Platform.OS !== "web") {
    const maps = require("react-native-maps");
    MapViewNative = maps.default ?? maps.MapView ?? maps;
    PolylineNative = maps.Polyline;
    MarkerNative = maps.Marker;
  }

  const currentLocationText = current
    ? `${current.latitude.toFixed(5)}, ${current.longitude.toFixed(5)}`
    : "Getting location";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: c.text }]}>Navigation</Text>

      <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.inputLabel, { color: c.text }]}>Current location</Text>
        <Text style={[styles.locationText, { color: c.muted }]}>{currentLocationText}</Text>

        <Text style={[styles.inputLabel, { color: c.text, marginTop: 14 }]}>Destination</Text>

        <View style={styles.searchRow}>
          <TextInput
            value={targetLocation}
            onChangeText={setTargetLocation}
            placeholder="Search a place"
            placeholderTextColor={c.muted}
            style={[
              styles.input,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                color: c.text,
              },
            ]}
          />

          <Pressable
            onPress={searchDestination}
            style={[styles.searchBtn, { backgroundColor: c.tint }]}
          >
            <Text style={styles.searchBtnText}>
              {searchingDestination ? "..." : "Search"}
            </Text>
          </Pressable>
        </View>

        {destinationCoords ? (
          <Text style={[styles.destinationMeta, { color: c.muted }]}>
            {destinationCoords.latitude.toFixed(5)}, {destinationCoords.longitude.toFixed(5)}
          </Text>
        ) : null}
      </View>

      <View style={[styles.mapWrap, { borderColor: c.border, backgroundColor: c.surface }]}>
        {Platform.OS === "web" ? (
          <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
            <Text style={[styles.webTitle, { color: c.text }]}>Map unavailable on web</Text>
            <Text style={[styles.webSub, { color: c.muted }]}>Use a device or emulator</Text>
          </View>
        ) : (
          MapViewNative && (
            <MapViewNative
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              showsUserLocation
              followsUserLocation
              showsMyLocationButton
              initialRegion={{
                latitude: current?.latitude ?? 37.7749,
                longitude: current?.longitude ?? -122.4194,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              {path.length >= 2 && PolylineNative && (
                <PolylineNative coordinates={path} strokeWidth={6} />
              )}

              {destinationCoords && MarkerNative && (
                <MarkerNative
                  coordinate={destinationCoords}
                  title="Destination"
                  description={targetLocation}
                />
              )}
            </MapViewNative>
          )
        )}

        <View style={styles.overlayTop}>
          <View style={[styles.chip, { backgroundColor: "rgba(18, 28, 22, 0.72)" }]}>
            <Text style={styles.chipText}>
              {permission === "granted" ? "GPS Ready" : permission === "denied" ? "GPS Denied" : "GPS"}
            </Text>
          </View>

          <View style={[styles.chip, { backgroundColor: "rgba(18, 28, 22, 0.72)" }]}>
            <Text style={styles.chipText}>{tracking ? "Tracking" : "Idle"}</Text>
          </View>
        </View>

        <View style={styles.overlayBottom}>
          <Pressable
            onPress={tracking ? stop : start}
            style={[styles.primaryBtn, { backgroundColor: c.tint }]}
          >
            <Text style={styles.primaryBtnText}>{tracking ? "End Ride" : "Start Ride"}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard value={`${speedKph.toFixed(1)}`} label="km/h" c={c} />
        <StatCard value={`${distKm.toFixed(2)}`} label="km" c={c} />
        <StatCard value={targetLocation || "—"} label="Target" c={c} />
        <StatCard value={destinationCoords ? "Ready" : "None"} label="Pin" c={c} />
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

  infoCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
  },

  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  searchBtn: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  destinationMeta: {
    marginTop: 10,
    fontSize: 13,
  },

  mapWrap: {
    height: 340,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },

  webPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  webTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  webSub: {
    marginTop: 6,
    fontSize: 13,
  },

  overlayTop: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },

  overlayBottom: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});