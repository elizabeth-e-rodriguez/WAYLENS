import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Switch,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const SESSION_KEY = "waylens_session";
const ACCOUNT_KEY = "waylens_account";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const [isCelsius, setIsCelsius] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("Not available");

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    try {
      const saved = await AsyncStorage.getItem(ACCOUNT_KEY);
      if (saved) {
        const account = JSON.parse(saved);
        setUsername(account.name || "User");
        setEmail(account.email || "Not available");
      }
    } catch (error) {
      console.log("LOAD ACCOUNT ERROR:", error);
    }
  }

  function confirmLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: handleLogout,
      },
    ]);
  }

  async function handleLogout() {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      router.replace("/");
    } catch (error) {
      console.log("LOGOUT ERROR:", error);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            Manage your account, device, and app preferences
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: c.tintSoft, borderColor: c.border },
          ]}
        >
          <Text style={[styles.avatarText, { color: c.tint }]}>
            {username?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: c.text }]}>{username}</Text>
          <Text style={[styles.profileEmail, { color: c.muted }]}>{email}</Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Preferences
        </Text>

        <View
          style={[
            styles.settingRow,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconWrap, { backgroundColor: c.tintSoft }]}>
              <Ionicons name="thermometer-outline" size={18} color={c.tint} />
            </View>
            <View>
              <Text style={[styles.label, { color: c.text }]}>
                Temperature Unit
              </Text>
              <Text style={[styles.subLabel, { color: c.muted }]}>
                {isCelsius ? "Celsius" : "Fahrenheit"}
              </Text>
            </View>
          </View>

          <Switch
            value={isCelsius}
            onValueChange={setIsCelsius}
            trackColor={{ false: "#ccc", true: c.tint }}
            thumbColor="#fff"
          />
        </View>

        <View
          style={[
            styles.settingRow,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconWrap, { backgroundColor: c.tintSoft }]}>
              <Ionicons name="notifications-outline" size={18} color={c.tint} />
            </View>
            <View>
              <Text style={[styles.label, { color: c.text }]}>
                Notifications
              </Text>
              <Text style={[styles.subLabel, { color: c.muted }]}>
                {notifications ? "Enabled" : "Disabled"}
              </Text>
            </View>
          </View>

          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#ccc", true: c.tint }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>Device</Text>

        <View
          style={[
            styles.infoRow,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconWrap, { backgroundColor: c.tintSoft }]}>
              <Ionicons name="glasses-outline" size={18} color={c.tint} />
            </View>
            <View>
              <Text style={[styles.label, { color: c.text }]}>
                Connection Status
              </Text>
              <Text style={[styles.subLabel, { color: c.muted }]}>
                Smart glasses link
              </Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Text style={{ color: c.tint, fontWeight: "800", fontSize: 13 }}>
              Connected
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.infoRow,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconWrap, { backgroundColor: c.tintSoft }]}>
              <Ionicons name="hardware-chip-outline" size={18} color={c.tint} />
            </View>
            <View>
              <Text style={[styles.label, { color: c.text }]}>
                Firmware Version
              </Text>
              <Text style={[styles.subLabel, { color: c.muted }]}>
                Current glasses firmware
              </Text>
            </View>
          </View>

          <Text style={[styles.valueText, { color: c.muted }]}>v1.0.0</Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>Account</Text>

        <View
          style={[
            styles.infoRow,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconWrap, { backgroundColor: c.tintSoft }]}>
              <Ionicons name="person-outline" size={18} color={c.tint} />
            </View>
            <View>
              <Text style={[styles.label, { color: c.text }]}>Signed In As</Text>
              <Text style={[styles.subLabel, { color: c.muted }]}>{email}</Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.logoutCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.logoutTitle, { color: c.text }]}>Log Out</Text>
        <Text style={[styles.logoutSub, { color: c.muted }]}>
          Sign out of your WAYLENS account on this device.
        </Text>

        <Pressable
          onPress={confirmLogout}
          style={[styles.logoutBtn, { backgroundColor: c.tint }]}
        >
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 16,
    paddingBottom: 160,
    flexGrow: 1,
  },

  header: {
    marginTop: 4,
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

  profileCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },

  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },

  settingRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  subLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  logoutCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    marginTop: 4,
  },
  logoutTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  logoutSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  logoutBtn: {
    marginTop: 4,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});