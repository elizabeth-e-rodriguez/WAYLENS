import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import * as Location from "expo-location";

type Mode = "BIKE" | "HIKE";

type Trail = {
  id: string;
  name: string;
  difficulty?: string;
  lengthKm?: number;
  location?: string;
  summary?: string;
  latitude?: number;
  longitude?: number;
};

const DEMO_TRAILS: Trail[] = [
  { id: "t1", name: "River Walk Loop", difficulty: "Easy", lengthKm: 3.2 },
  { id: "t2", name: "Pine Ridge Trail", difficulty: "Moderate", lengthKm: 6.8 },
  { id: "t3", name: "Summit View Route", difficulty: "Hard", lengthKm: 10.5 },
];

const HIKING_PROJECT_KEY = ""; // REI Hiking Project API key
const MAX_DISTANCE_MILES = 25;

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>("HIKE");
  const [locationText, setLocationText] = useState("Getting location...");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [speedKmh, setSpeedKmh] = useState(0);

  const [query, setQuery] = useState("");
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

  const [loadingTrails, setLoadingTrails] = useState(false);
  const [trailError, setTrailError] = useState<string | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Location permission denied");
        return;
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          setCoords({ lat, lon });
          setLocationText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);

          const kmh = Math.max(0, (pos.coords.speed ?? 0) * 3.6);
          setSpeedKmh(kmh);
        }
      );
    })();

    return () => {
      if (sub) sub.remove();
    };
  }, []);

  async function searchTrailsNearby() {
    Keyboard.dismiss();
    setTrailError(null);

    if (!coords) {
      setTrailError("No GPS yet. Please wait for location.");
      return;
    }

    setLoadingTrails(true);
    try {
      if (!HIKING_PROJECT_KEY) {
        setTrails(applyQueryFilter(DEMO_TRAILS, query));
        return;
      }
      const url =
        `https://www.hikingproject.com/data/get-trails?` +
        `lat=${coords.lat}&lon=${coords.lon}&maxDistance=${MAX_DISTANCE_MILES}&key=${HIKING_PROJECT_KEY}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Trail API failed (${res.status})`);
      const json = await res.json();
      const apiTrails: Trail[] = (json?.trails ?? []).map((t: any) => ({
        id: String(t.id),
        name: t.name,
        difficulty: t.difficulty,
        lengthKm: typeof t.length === "number" ? t.length * 1.60934 : undefined,
        location: t.location,
        summary: t.summary,
        latitude: t.latitude,
        longitude: t.longitude,
      }));
      setTrails(applyQueryFilter(apiTrails, query));
    } catch (e: any) {
      setTrailError(e?.message ?? "Trail search failed.");
      setTrails(applyQueryFilter(DEMO_TRAILS, query));
    } finally {
      setLoadingTrails(false);
    }
  }

  function applyQueryFilter(list: Trail[], q: string) {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return list;
    return list.filter((t) =>
      `${t.name} ${t.location ?? ""} ${t.summary ?? ""}`.toLowerCase().includes(trimmed)
    );
  }

  const hudPreview = useMemo(() => {
    return mode === "BIKE"
      ? `MODE: BIKE\nSPEED: ${speedKmh.toFixed(0)} km/h\nNEXT: → 350m\nTRIP: 4.2 km`
      : `MODE: HIKE\nTRAIL: ${selectedTrail?.name ?? "None"}\nNEXT: → 120m\nTRIP: 2.1 km`;
  }, [mode, speedKmh, selectedTrail]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WAYLENS</Text>

      <View style={styles.modeRow}>
        {(["BIKE", "HIKE"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeBtn, active && styles.modeBtnActive]}
              accessibilityLabel={`Switch mode to ${m === "BIKE" ? "bike" : "hike"}`}
            >
              <Text style={active ? styles.modeTextActive : styles.modeText}>
                {m === "BIKE" ? "🚴 BIKE" : "🥾 HIKE"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.bold}>GPS</Text>
        <Text>Location: {locationText}</Text>
        <Text>Speed: {speedKmh.toFixed(1)} km/h</Text>
      </View>

      {mode === "HIKE" && (
        <View style={styles.card}>
          <Text style={styles.bold}>Trail Search</Text>
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search keyword (optional)"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={searchTrailsNearby}
            />
            <Pressable onPress={searchTrailsNearby} style={styles.searchBtn} disabled={loadingTrails}>
              <Text style={styles.searchBtnText}>{loadingTrails ? "..." : "Search"}</Text>
            </Pressable>
          </View>

          {trailError && <Text style={styles.errorText}>{trailError}</Text>}

          {loadingTrails ? (
            <View style={{ paddingTop: 12 }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>Searching trails near you...</Text>
            </View>
          ) : (
            <FlatList
              style={{ marginTop: 10, maxHeight: 260 }}
              data={trails}
              keyExtractor={(i) => i.id}
              ListEmptyComponent={<Text style={{ marginTop: 8 }}>Tap Search to load trails.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedTrail(item)}
                  style={[
                    styles.trailCard,
                    selectedTrail?.id === item.id && styles.trailCardActive,
                  ]}
                >
                  <Text style={styles.trailName}>{item.name}</Text>
                  <Text style={styles.trailMeta}>
                    {(item.difficulty ?? "Unknown")} •{" "}
                    {item.lengthKm ? `${item.lengthKm.toFixed(1)} km` : "N/A"}
                  </Text>
                  {item.location ? <Text style={styles.trailMeta}>{item.location}</Text> : null}
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.bold}>HUD Preview</Text>
        <Text style={styles.mono}>{hudPreview}</Text>

        <Pressable
          onPress={() => Alert.alert("Preview", hudPreview)}
          style={styles.sendBtn}
        >
          <Text style={styles.sendBtnText}>Preview HUD</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700" },

  modeRow: { flexDirection: "row", gap: 10, marginVertical: 6 },
  modeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  modeBtnActive: { backgroundColor: "#0b66ff" },
  modeText: { fontWeight: "600" },
  modeTextActive: { color: "#fff", fontWeight: "700" },

  card: { padding: 12, borderRadius: 10, backgroundColor: "#f9f9f9" },
  bold: { fontWeight: "700", marginBottom: 6 },

  searchRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchBtn: {
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#0b66ff",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "700" },

  errorText: { marginTop: 8, color: "#b00020" },

  trailCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  trailCardActive: { borderColor: "#0b66ff" },
  trailName: { fontWeight: "700", fontSize: 16 },
  trailMeta: { marginTop: 2, color: "#444" },

  sendBtn: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#0b66ff",
    alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "700" },

  mono: { fontFamily: "monospace", marginTop: 6 },
});