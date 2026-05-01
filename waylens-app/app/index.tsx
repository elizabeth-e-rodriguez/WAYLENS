import React, { useEffect, useState } from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";

type AuthMode = "login" | "signup";

const ACCOUNT_KEY = "waylens_account";
const SESSION_KEY = "waylens_session";

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      if (session) {
        router.replace("/(tabs)");
        return;
      }
    } catch (error) {
      console.log("SESSION ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }

    try {
      const account = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email: account.email }));

      router.replace("/(tabs)");
    } catch (error) {
      console.log("SIGNUP ERROR:", error);
      Alert.alert("Error", "Could not create account.");
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Enter email and password.");
      return;
    }

    try {
      const saved = await AsyncStorage.getItem(ACCOUNT_KEY);

      if (!saved) {
        Alert.alert("No account found", "Create an account first.");
        return;
      }

      const account = JSON.parse(saved);

      if (
        account.email !== email.trim().toLowerCase() ||
        account.password !== password
      ) {
        Alert.alert("Login failed", "Invalid email or password.");
        return;
      }

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ email: account.email })
      );

      router.replace("/(tabs)");
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      Alert.alert("Error", "Could not log in.");
    }
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingWrap,
          { backgroundColor: c.background },
        ]}
      >
        <ActivityIndicator size="large" color={c.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerWrap}>
        <Text style={[styles.welcome, { color: c.tint }]}>WAYLENS</Text>
        <Text style={[styles.title, { color: c.text }]}>
          {authMode === "login" ? "Login" : "Create Account"}
        </Text>
        <Text style={[styles.sub, { color: c.muted }]}>
          {authMode === "login"
            ? "Sign in to continue to your smart glasses app"
            : "Create an account to get started"}
        </Text>
      </View>

      <View
        style={[
          styles.authCard,
          {
            backgroundColor: c.card,
            borderColor: c.border,
          },
        ]}
      >
        {authMode === "signup" ? (
          <>
            <Text style={[styles.label, { color: c.text }]}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
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
          </>
        ) : null}

        <Text style={[styles.label, { color: c.text, marginTop: authMode === "signup" ? 14 : 0 }]}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[
            styles.input,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              color: c.text,
            },
          ]}
        />

        <Text style={[styles.label, { color: c.text, marginTop: 14 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor={c.muted}
          secureTextEntry
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
          onPress={authMode === "login" ? handleLogin : handleSignUp}
          style={[styles.primaryBtn, { backgroundColor: c.tint }]}
        >
          <Ionicons
            name={authMode === "login" ? "log-in-outline" : "person-add-outline"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.primaryBtnText}>
            {authMode === "login" ? "Login" : "Create Account"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setAuthMode(authMode === "login" ? "signup" : "login");
            setName("");
            setEmail("");
            setPassword("");
          }}
          style={styles.switchBtn}
        >
          <Text style={[styles.switchText, { color: c.tint }]}>
            {authMode === "login"
              ? "Don’t have an account? Create one"
              : "Already have an account? Login"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 60,
    flexGrow: 1,
    justifyContent: "center",
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
  authCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  primaryBtn: {
    marginTop: 20,
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
    fontSize: 15,
  },
  switchBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    fontWeight: "700",
  },
});