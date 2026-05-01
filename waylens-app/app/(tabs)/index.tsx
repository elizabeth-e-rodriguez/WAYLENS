import React, { useState, useEffect } from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  View,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";

type Mode = "BIKE" | "HIKE";

const ACCOUNT_KEY = "waylens_account";

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const [mode, setMode] = useState<Mode>("HIKE");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const saved = await AsyncStorage.getItem(ACCOUNT_KEY);
      if (saved) {
        const account = JSON.parse(saved);
        setUsername(account.name);
      }
    } catch (error) {
      console.log("LOAD USER ERROR:", error);
    }
  }

  function startMode(nextMode: Mode) {
    setMode(nextMode);
    (global as any).__waylensMode = nextMode === "BIKE" ? "bike" : "hike";
    router.push("/navigation");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerWrap}>
        <Text style={[styles.welcome, { color: c.tint }]}>Welcome back</Text>
        <Text style={[styles.title, { color: c.text }]}>
          {username || "User"}
        </Text>
        <Text style={[styles.sub, { color: c.muted }]}>
          Ready for your next ride or hike?
        </Text>
      </View>

      <ImageBackground
        source={require("@/assets/images/hike.png")}
        style={styles.heroImageCard}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroBadgeRow}>
            <View
              style={[
                styles.heroBadge,
                {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderColor: "rgba(255,255,255,0.22)",
                },
              ]}
            >
              <Ionicons name="bicycle" size={18} color="#fff" />
              <Text style={styles.heroBadgeText}>Cycling</Text>
            </View>

            <View
              style={[
                styles.heroBadge,
                {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderColor: "rgba(255,255,255,0.22)",
                },
              ]}
            >
              <Ionicons name="walk" size={18} color="#fff" />
              <Text style={styles.heroBadgeText}>Hiking</Text>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroHeadline}>
              See the Way. Stay in Motion.
            </Text>
            <Text style={styles.heroCaption}>
              Choose your activity and start guided navigation through your HUD.
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => startMode("BIKE")}
          style={[
            styles.modeBtn,
            {
              backgroundColor: mode === "BIKE" ? c.tint : c.card,
              borderColor: mode === "BIKE" ? c.tint : c.border,
            },
          ]}
        >
          <Ionicons
            name="bicycle"
            size={18}
            color={mode === "BIKE" ? "#FFFFFF" : c.text}
          />
          <Text
            style={[
              styles.modeText,
              { color: mode === "BIKE" ? "#FFFFFF" : c.text },
            ]}
          >
            Bike
          </Text>
        </Pressable>

        <Pressable
          onPress={() => startMode("HIKE")}
          style={[
            styles.modeBtn,
            {
              backgroundColor: mode === "HIKE" ? c.tint : c.card,
              borderColor: mode === "HIKE" ? c.tint : c.border,
            },
          ]}
        >
          <Ionicons
            name="walk"
            size={18}
            color={mode === "HIKE" ? "#FFFFFF" : c.text}
          />
          <Text
            style={[
              styles.modeText,
              { color: mode === "HIKE" ? "#FFFFFF" : c.text },
            ]}
          >
            Hike
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.actionCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.actionTitle, { color: c.text }]}>
          Quick Actions
        </Text>
        <Text style={[styles.actionSub, { color: c.muted }]}>
          Jump into the parts of the app you use most.
        </Text>

        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push("/hud")}
            style={[styles.quickBtn, { backgroundColor: c.tint }]}
          >
            <Ionicons name="glasses-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickBtnText}>HUD</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/logs")}
            style={[styles.quickBtn, { backgroundColor: c.tint }]}
          >
            <Ionicons name="time-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickBtnText}>Logs</Text>
          </Pressable>
        </View>

        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push("/settings")}
            style={[styles.quickBtn, { backgroundColor: c.surface }]}
          >
            <Ionicons name="settings-outline" size={18} color={c.text} />
            <Text style={[styles.quickBtnTextAlt, { color: c.text }]}>
              Settings
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/navigation")}
            style={[styles.quickBtn, { backgroundColor: c.surface }]}
          >
            <Ionicons name="navigate-outline" size={18} color={c.text} />
            <Text style={[styles.quickBtnTextAlt, { color: c.text }]}>
              Navigation
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.statusCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.statusTitle, { color: c.text }]}>
          Current Selection
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: c.tintSoft }]}>
            <Ionicons
              name={mode === "BIKE" ? "bicycle" : "walk"}
              size={16}
              color={c.tint}
            />
            <Text style={[styles.statusBadgeText, { color: c.tint }]}>
              {mode === "BIKE" ? "Bike Mode" : "Hike Mode"}
            </Text>
          </View>
        </View>

        <Text style={[styles.statusText, { color: c.muted }]}>
          Tap one of the mode buttons above to launch navigation directly in that mode.
        </Text>
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

  headerWrap: {
    marginTop: 6,
  },
  welcome: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    marginTop: 2,
  },
  sub: {
    fontSize: 15,
    marginTop: 4,
  },

  heroImageCard: {
    height: 420,
    borderRadius: 30,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  heroImage: {
    borderRadius: 30,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.30)",
    padding: 20,
    justifyContent: "space-between",
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  heroBottom: {
    gap: 8,
  },
  heroHeadline: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  heroCaption: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 21,
    maxWidth: "92%",
  },

  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
  },
  modeText: {
    fontSize: 15,
    fontWeight: "700",
  },

  actionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  actionSub: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  quickBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  quickBtnTextAlt: {
    fontWeight: "800",
    fontSize: 14,
  },

  statusCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
  },
});