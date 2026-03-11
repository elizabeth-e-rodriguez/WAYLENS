import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0) + 10;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerShadowVisible: false,

        tabBarButton: HapticTab,
        tabBarActiveTintColor: c.tint,
        tabBarInactiveTintColor: "rgba(140,140,140,0.9)",

        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: "rgba(120,120,120,0.12)",

          // This is the key: raise the bar by respecting safe area + extra padding
          paddingTop: 6,
          paddingBottom: bottomPad,

          // Height must include the bottom padding or it will still feel cramped/low
          height: 52 + bottomPad,
        },

        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="hud"
        options={{
          title: "HUD",
          tabBarLabel: "HUD",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="eyeglasses" color={color} />,
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Navigation",
          tabBarLabel: "Nav",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="location.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: "Logs",
          tabBarLabel: "Logs",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}