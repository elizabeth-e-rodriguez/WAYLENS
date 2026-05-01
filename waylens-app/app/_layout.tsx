import React from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Appearance } from "react-native";
import "react-native-reanimated";

import { ThemeModeProvider, useThemeMode } from "@/components/theme/ThemeMode";

function InnerLayout() {
  const system = Appearance.getColorScheme() ?? "light";
  const { mode } = useThemeMode();

  const effective = mode === "system" ? system : mode;

  return (
    <ThemeProvider value={effective === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style={effective === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <InnerLayout />
    </ThemeModeProvider>
  );
}