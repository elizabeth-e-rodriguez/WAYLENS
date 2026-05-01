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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRideStore } from "@/components/ride/rideStore";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type HudTurn = "LEFT" | "RIGHT" | "STRAIGHT";
type NavMode = "bike" | "hike";

type RoutePoint = {
  latitude: number;
  longitude: number;
};

type NavStep = {
  turn: HudTurn;
  distanceMeters: number;
  instruction: string;
};

const GOOGLE_MAPS_KEY = "ADD_YOUR_GOOGLE_MAPS_API_KEY_HERE";
const TRAVEL_LOGS_KEY = "waylens_travel_logs";

function StatCard({
  value,
  label,
  icon,
  c,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  c: any;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: c.surface }]}>
        <Ionicons name={icon} size={18} color={c.tint} />
      </View>
      <Text style={[styles.statValue, { color: c.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

function mapTurn(instruction?: string): HudTurn {
  const text = String(instruction ?? "").toLowerCase();

  if (text.includes("left")) return "LEFT";
  if (text.includes("right")) return "RIGHT";
  return "STRAIGHT";
}

function formatDistance(meters: number) {
  const feet = meters * 3.28084;
  if (feet < 1000) return `${Math.round(feet)} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
}

function getElevationText(instruction?: string) {
  const text = String(instruction ?? "").toLowerCase();

  if (
    text.includes("uphill") ||
    text.includes("up hill") ||
    text.includes("climb") ||
    text.includes("ascend")
  ) {
    return "uphill";
  }

  if (
    text.includes("downhill") ||
    text.includes("down hill") ||
    text.includes("descend")
  ) {
    return "downhill";
  }

  return "flat";
}

function decodePolyline(encoded: string): RoutePoint[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: RoutePoint[] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

async function geocodeAddress(address: string): Promise<RoutePoint> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&key=${GOOGLE_MAPS_KEY}`;

  const res = await fetch(url);
  const json = await res.json();

  console.log("GEOCODE RESPONSE:", JSON.stringify(json, null, 2));

  if (!res.ok || json.status !== "OK" || !json.results?.length) {
    throw new Error(json?.error_message || json?.status || JSON.stringify(json));
  }

  const loc = json.results[0].geometry.location;

  return {
    latitude: loc.lat,
    longitude: loc.lng,
  };
}

async function getRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  mode: NavMode
) {
  const travelMode = mode === "hike" ? "WALK" : "BICYCLE";

  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.localizedValues",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
        travelMode,
        languageCode: "en-US",
        units: "IMPERIAL",
      }),
    }
  );

  const json = await res.json();

  console.log("ROUTES RESPONSE:", JSON.stringify(json, null, 2));

  if (!res.ok || !json.routes?.length) {
    throw new Error(
      json?.error?.message ||
        json?.error_message ||
        json?.status ||
        JSON.stringify(json)
    );
  }

  const route = json.routes[0];

  const steps: NavStep[] = (route.legs?.[0]?.steps ?? []).map((s: any) => {
    const instruction = s.navigationInstruction?.instructions ?? "Go straight";

    return {
      turn: mapTurn(instruction),
      distanceMeters: Number(s.distanceMeters ?? 0),
      instruction,
    };
  });

  const coords = decodePolyline(route.polyline?.encodedPolyline ?? "");

  return { steps, coords };
}

export default function NavigationScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const mapRef = useRef<any>(null);
  const { permission, tracking, current, speedMps, totalMeters, start, stop } =
    useRideStore();

  const [mode, setMode] = useState<NavMode>("bike");
  const [targetLocation, setTargetLocation] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<RoutePoint | null>(
    null
  );
  const [searchingDestination, setSearchingDestination] = useState(false);

  const [routeCoords, setRouteCoords] = useState<RoutePoint[]>([]);
  const [steps, setSteps] = useState<NavStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [rideStartedAt, setRideStartedAt] = useState<number | null>(null);

  const speedKph = useMemo(() => Math.max(0, speedMps) * 3.6, [speedMps]);
  const distKm = useMemo(() => totalMeters / 1000, [totalMeters]);

  const currentStep = steps[stepIndex] ?? null;

  useEffect(() => {
    (global as any).__waylensMode = mode;
  }, [mode]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!current) return;

    if (current && destinationCoords) {
      try {
        mapRef.current?.fitToCoordinates?.([current, destinationCoords], {
          edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
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

  useEffect(() => {
    (global as any).__waylensTurn = currentStep?.turn ?? "STRAIGHT";
    (global as any).__waylensTurnDistanceText = currentStep
      ? formatDistance(currentStep.distanceMeters)
      : "—";
    (global as any).__waylensElevationText =
      mode === "hike" ? getElevationText(currentStep?.instruction) : "flat";
    (global as any).__waylensRouteInstruction =
      currentStep?.instruction ?? "No route loaded";
  }, [currentStep, mode]);

  async function saveTravelLog() {
    try {
      const now = new Date();

      const newLog = {
        id: String(now.getTime()),
        mode,
        destination: targetLocation.trim() || "Unknown destination",
        dateLabel: now.toLocaleDateString(),
        timeLabel: now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
        distanceKm: Number(distKm.toFixed(2)),
        durationMin: rideStartedAt
          ? Math.max(1, Math.round((Date.now() - rideStartedAt) / 60000))
          : 1,
        createdAt: now.toISOString(),
      };

      const saved = await AsyncStorage.getItem(TRAVEL_LOGS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      const updated = [newLog, ...parsed];

      await AsyncStorage.setItem(TRAVEL_LOGS_KEY, JSON.stringify(updated));
      Alert.alert("Saved", "Travel log saved.");
    } catch (error) {
      console.log("SAVE TRAVEL LOG ERROR:", error);
      Alert.alert("Error", "Could not save travel log.");
    }
  }

  function resetRouteState() {
    setDestinationCoords(null);
    setRouteCoords([]);
    setSteps([]);
    setStepIndex(0);
    (global as any).__waylensTurn = "STRAIGHT";
    (global as any).__waylensTurnDistanceText = "—";
    (global as any).__waylensElevationText = "flat";
    (global as any).__waylensRouteInstruction = "No route loaded";
  }

  async function searchDestination() {
    if (!targetLocation.trim()) {
      Alert.alert("Destination", "Enter a place first.");
      return;
    }

    if (!current) {
      Alert.alert("GPS", "Waiting for current location.");
      return;
    }

    if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY.includes("PASTE_YOUR")) {
      Alert.alert("API Key", "Add your Google Maps API key first.");
      return;
    }

    try {
      setSearchingDestination(true);

      const dest = await geocodeAddress(targetLocation.trim());
      setDestinationCoords(dest);

      const route = await getRoute(current, dest, mode);

      setRouteCoords(route.coords);
      setSteps(route.steps);
      setStepIndex(0);

      const firstStep = route.steps[0];
      (global as any).__waylensTurn = firstStep?.turn ?? "STRAIGHT";
      (global as any).__waylensTurnDistanceText = firstStep
        ? formatDistance(firstStep.distanceMeters)
        : "—";
      (global as any).__waylensElevationText =
        mode === "hike" ? getElevationText(firstStep?.instruction) : "flat";
      (global as any).__waylensRouteInstruction =
        firstStep?.instruction ?? "No route loaded";
    } catch (error: any) {
      console.log("NAV SEARCH ERROR:", error);

      Alert.alert(
        "Search Failed",
        String(error?.message ?? error ?? "Unknown error")
      );

      resetRouteState();
    } finally {
      setSearchingDestination(false);
    }
  }

  function nextStep() {
    setStepIndex((prev) => Math.min(prev + 1, Math.max(steps.length - 1, 0)));
  }

  function handleRideButton() {
    if (!tracking) {
      setRideStartedAt(Date.now());
      start();
      return;
    }

    Alert.alert(
      "End Navigation",
      "Do you want to save this travel to your logs?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            stop();
            setRideStartedAt(null);
          },
        },
        {
          text: "Save",
          onPress: async () => {
            await saveTravelLog();
            stop();
            setRideStartedAt(null);
          },
        },
      ]
    );
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

  const nextCueText = currentStep
    ? `${currentStep.turn} • ${formatDistance(currentStep.distanceMeters)}`
    : "No route";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>Navigation</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            Plan your route and send the next cue to the HUD
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: tracking ? c.tintSoft : c.surface,
              borderColor: tracking ? c.tint : c.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: tracking ? c.tint : c.muted },
            ]}
          />
          <Text
            style={[
              styles.statusPillText,
              { color: tracking ? c.tint : c.muted },
            ]}
          >
            {tracking ? "Tracking" : "Idle"}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.panel,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>Travel Mode</Text>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("bike")}
            style={[
              styles.modeBtn,
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
                styles.modeBtnText,
                { color: mode === "bike" ? "#FFFFFF" : c.text },
              ]}
            >
              Bike
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("hike")}
            style={[
              styles.modeBtn,
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
                styles.modeBtnText,
                { color: mode === "hike" ? "#FFFFFF" : c.text },
              ]}
            >
              Hike
            </Text>
          </Pressable>
        </View>

        <Text
          style={[styles.sectionTitle, { color: c.text, marginTop: 18 }]}
        >
          Destination
        </Text>
        <Text style={[styles.helperText, { color: c.muted }]}>
          Search for a place and generate a route from your current location.
        </Text>

        <Text style={[styles.inputLabel, { color: c.text }]}>
          Current location
        </Text>
        <Text style={[styles.locationText, { color: c.muted }]}>
          {currentLocationText}
        </Text>

        <Text style={[styles.inputLabel, { color: c.text, marginTop: 14 }]}>
          Search place
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            value={targetLocation}
            onChangeText={setTargetLocation}
            placeholder="Enter a trail, park, or address"
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
            <Ionicons name="search-outline" size={18} color="#FFFFFF" />
            <Text style={styles.searchBtnText}>
              {searchingDestination ? "..." : "Search"}
            </Text>
          </Pressable>
        </View>

        {destinationCoords ? (
          <View
            style={[
              styles.destinationBadge,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Ionicons name="location-outline" size={16} color={c.tint} />
            <Text style={[styles.destinationText, { color: c.text }]}>
              {destinationCoords.latitude.toFixed(5)},{" "}
              {destinationCoords.longitude.toFixed(5)}
            </Text>
          </View>
        ) : null}
      </View>

      {currentStep ? (
        <Pressable
          onPress={nextStep}
          style={[
            styles.activeStepCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.activeStepTop}>
            <View
              style={[
                styles.turnBubble,
                { backgroundColor: c.tintSoft, borderColor: c.tint },
              ]}
            >
              <Text style={[styles.turnBubbleText, { color: c.tint }]}>
                {currentStep.turn === "LEFT"
                  ? "←"
                  : currentStep.turn === "RIGHT"
                    ? "→"
                    : "↑"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.activeStepMeta, { color: c.tint }]}>
                {nextCueText}
              </Text>
              <Text style={[styles.activeStepTitle, { color: c.text }]}>
                {currentStep.instruction}
              </Text>
              <Text style={[styles.activeStepHint, { color: c.muted }]}>
                {mode === "hike"
                  ? `Terrain: ${getElevationText(currentStep.instruction)}`
                  : "Tap to move to the next step while testing"}
              </Text>
            </View>
          </View>
        </Pressable>
      ) : null}

      <View
        style={[
          styles.mapWrap,
          { borderColor: c.border, backgroundColor: c.surface },
        ]}
      >
        {Platform.OS === "web" ? (
          <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
            <Ionicons name="map-outline" size={34} color={c.muted} />
            <Text style={[styles.webTitle, { color: c.text }]}>
              Map unavailable on web
            </Text>
            <Text style={[styles.webSub, { color: c.muted }]}>
              Use a device or emulator to view the map
            </Text>
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
              {routeCoords.length >= 2 && PolylineNative && (
                <PolylineNative coordinates={routeCoords} strokeWidth={6} />
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
          <View style={styles.overlayRow}>
            <View
              style={[
                styles.mapChip,
                { backgroundColor: "rgba(18, 28, 22, 0.76)" },
              ]}
            >
              <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
              <Text style={styles.mapChipText}>
                {permission === "granted"
                  ? "GPS Ready"
                  : permission === "denied"
                    ? "GPS Denied"
                    : "GPS"}
              </Text>
            </View>

            <View
              style={[
                styles.mapChip,
                { backgroundColor: "rgba(18, 28, 22, 0.76)" },
              ]}
            >
              <Ionicons
                name={mode === "hike" ? "walk-outline" : "bicycle-outline"}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.mapChipText}>
                {mode === "hike" ? "Hike" : "Bike"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.overlayBottom}>
          <Pressable
            onPress={handleRideButton}
            style={[styles.primaryBtn, { backgroundColor: c.tint }]}
          >
            <Ionicons
              name={tracking ? "stop-circle-outline" : "play-circle-outline"}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.primaryBtnText}>
              {tracking ? "End Ride" : "Start Ride"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard
          value={mode === "hike" ? "Hike" : `${speedKph.toFixed(1)}`}
          label={mode === "hike" ? "Mode" : "km/h"}
          icon={mode === "hike" ? "walk-outline" : "speedometer-outline"}
          c={c}
        />

        <StatCard
          value={`${distKm.toFixed(2)}`}
          label="Distance (km)"
          icon="map-outline"
          c={c}
        />

        <StatCard
          value={targetLocation || "—"}
          label="Destination"
          icon="location-outline"
          c={c}
        />

        <StatCard
          value={
            mode === "hike"
              ? ((global as any).__waylensElevationText ?? "flat")
              : currentStep
                ? currentStep.turn
                : "None"
          }
          label={mode === "hike" ? "Terrain" : "Next Turn"}
          icon={
            mode === "hike"
              ? "trail-sign-outline"
              : "arrow-forward-outline"
          }
          c={c}
        />
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

  statusPill: {
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
  statusPillText: {
    fontSize: 12,
    fontWeight: "800",
  },

  panel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
  },

  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },

  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    fontSize: 14,
  },
  searchBtn: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  destinationBadge: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  destinationText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  activeStepCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  activeStepTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  turnBubble: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  turnBubbleText: {
    fontSize: 30,
    fontWeight: "900",
  },
  activeStepMeta: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  activeStepTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
  },
  activeStepHint: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },

  mapWrap: {
    height: 360,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
  },

  webPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  webTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  webSub: {
    fontSize: 13,
  },

  overlayTop: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
  },
  overlayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  mapChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapChipText: {
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
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
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
  statCard: {
    width: "48%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});