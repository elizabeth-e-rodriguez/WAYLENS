import React, { useState } from "react";
import { StyleSheet, View, Switch, Text, ScrollView } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function Row({
  title,
  value,
  right,
  c,
}: {
  title: string;
  value?: string;
  right?: React.ReactNode;
  c: any;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.text }]}>{title}</Text>
        {value ? <Text style={[styles.rowValue, { color: c.muted }]}>{value}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Section({
  title,
  children,
  c,
}: {
  title: string;
  children: React.ReactNode;
  c: any;
}) {
  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.sectionTitle, { color: c.muted }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme ?? "light"];
  const [metricUnits, setMetricUnits] = useState(true);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: c.text }]}>Settings</Text>

      <Section title="Device" c={c}>
        <Row title="HUD Connection" value="Not Connected" c={c} />
      </Section>

      <Section title="Preferences" c={c}>
        <Row
          title="Units"
          value={metricUnits ? "km/h, km" : "mph, mi"}
          c={c}
          right={
            <Switch
              value={metricUnits}
              onValueChange={setMetricUnits}
              trackColor={{ false: "#C8D0C6", true: c.tint }}
            />
          }
        />
      </Section>
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

  section: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  rowValue: {
    fontSize: 13,
    marginTop: 4,
  },
});