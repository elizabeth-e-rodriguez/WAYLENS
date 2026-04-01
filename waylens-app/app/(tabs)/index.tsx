import React, { useEffect, useState } from "react";
import {
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  View,
} from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

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

const HIKING_PROJECT_KEY = "";
const MAX_DISTANCE_MILES = 25;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const [mode, setMode] = useState<Mode>("HIKE");
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
      if (status !== "granted") return;

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
          setSpeedKmh(Math.max(0, (pos.coords.speed ?? 0) * 3.6));
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
      setTrailError("Waiting for GPS");
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
      setTrailError(e?.message ?? "Trail search failed");
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

  const gpsReady = !!coords;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: c.text }]}>WAYLENS</Text>
      <Text style={[styles.sub, { color: c.muted }]}>Ride. Hike. Stay focused.</Text>

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => {
            setMode("BIKE");
            router.push("/navigation");
          }}
          style={[
            styles.modeBtn,
            {
              backgroundColor: c.tint,
              borderColor: c.tint,
            },
          ]}
        >
          <Text style={[styles.modeText, { color: "#FFFFFF" }]}> Bike</Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("HIKE")}
          style={[
            styles.modeBtn,
            {
              backgroundColor: mode === "HIKE" ? c.tintSoft : c.card,
              borderColor: mode === "HIKE" ? c.tint : c.border,
            },
          ]}
        >
          <Text style={[styles.modeText, { color: c.text }]}> Hike</Text>
        </Pressable>
      </View>

      <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroNumber, { color: c.text }]}>{speedKmh.toFixed(0)}</Text>
            <Text style={[styles.heroLabel, { color: c.muted }]}>km/h</Text>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: gpsReady ? c.tintSoft : c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: gpsReady ? c.tint : c.muted }]}>
              {gpsReady ? "GPS Ready" : "Getting GPS"}
            </Text>
          </View>
        </View>

        {mode === "HIKE" && selectedTrail ? (
          <Text style={[styles.selectedTrail, { color: c.text }]}>{selectedTrail.name}</Text>
        ) : null}
      </View>

      {mode === "HIKE" && (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Trails</Text>

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search trails"
              placeholderTextColor={c.muted}
              style={[
                styles.input,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  color: c.text,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={searchTrailsNearby}
            />

            <Pressable
              onPress={searchTrailsNearby}
              style={[styles.searchBtn, { backgroundColor: c.tint }]}
              disabled={loadingTrails}
            >
              <Text style={styles.searchBtnText}>{loadingTrails ? "..." : "Search"}</Text>
            </Pressable>
          </View>

          {trailError ? <Text style={[styles.errorText, { color: c.danger }]}>{trailError}</Text> : null}

          {loadingTrails ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={c.tint} />
            </View>
          ) : (
            <FlatList
              style={{ marginTop: 10, maxHeight: 240 }}
              data={trails}
              keyExtractor={(i) => i.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: c.muted }]}>Search to load trails</Text>
              }
              renderItem={({ item }) => {
                const active = selectedTrail?.id === item.id;
                return (
                  <Pressable
                    onPress={() => setSelectedTrail(item)}
                    style={[
                      styles.trailCard,
                      {
                        backgroundColor: active ? c.tintSoft : c.surface,
                        borderColor: active ? c.tint : c.border,
                      },
                    ]}
                  >
                    <Text style={[styles.trailName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[styles.trailMeta, { color: c.muted }]}>
                      {(item.difficulty ?? "Unknown")} •{" "}
                      {item.lengthKm ? `${item.lengthKm.toFixed(1)} km` : "N/A"}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      )}
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
  sub: {
    fontSize: 14,
    marginTop: -6,
  },

  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  modeText: {
    fontSize: 15,
    fontWeight: "700",
  },

  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroNumber: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 46,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectedTrail: {
    fontSize: 16,
    fontWeight: "600",
  },

  badge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
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
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  trailCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  trailName: {
    fontSize: 15,
    fontWeight: "700",
  },
  trailMeta: {
    marginTop: 4,
    fontSize: 13,
  },

  loadingWrap: {
    paddingVertical: 18,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
  },
});