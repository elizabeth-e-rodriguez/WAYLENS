import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const bottomPad =
    Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0) + 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: c.background,
        },
        headerTintColor: c.text,
        headerShadowVisible: false,
        sceneStyle: {
          backgroundColor: c.background,
        },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: c.tint,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 10,
          height: 60 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          backgroundColor: c.card,
          borderTopWidth: 0,
          borderRadius: 22,
          elevation: 0,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="hud"
        options={{
          title: "Display",
          tabBarLabel: "Display",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "glasses" : "glasses-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="navigation"
        options={{
          title: "Navigation",
          tabBarLabel: "Navigation",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "navigate" : "navigate-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="logs"
        options={{
          title: "Logs",
          tabBarLabel: "Logs",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}