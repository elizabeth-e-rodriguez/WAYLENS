// components/ride/rideStore.ts
import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";

export type LatLng = { latitude: number; longitude: number };

function toLatLng(loc: Location.LocationObject): LatLng {
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}

function metersBetween(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Single source of truth for "Cycling Mode" live metrics.
 * Both Navigation + HUD will read from this hook.
 */
export function useRideStore() {
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [tracking, setTracking] = useState(false);

  const [current, setCurrent] = useState<LatLng | null>(null);
  const [path, setPath] = useState<LatLng[]>([]);
  const [speedMps, setSpeedMps] = useState(0);

  const totalMetersRef = useRef(0);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  const totalMeters = useMemo(() => totalMetersRef.current, [path.length]);

  const requestPermission = async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    setPermission(res.status === "granted" ? "granted" : "denied");
    return res.status === "granted";
  };

  const start = async () => {
    if (tracking) return;
    const ok = await requestPermission();
    if (!ok) throw new Error("Location permission denied");

    totalMetersRef.current = 0;
    setPath([]);
    setTracking(true);

    watcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
      },
      (loc) => {
        const p = toLatLng(loc);
        setCurrent(p);
        setSpeedMps(loc.coords.speed ?? 0);

        setPath((prev) => {
          if (prev.length) {
            const d = metersBetween(prev[prev.length - 1], p);

            // jitter / teleport guard
            if (d < 0.8 || d > 60) return prev;

            totalMetersRef.current += d;
          }
          return [...prev, p];
        });
      }
    );
  };

  const stop = () => {
    watcherRef.current?.remove();
    watcherRef.current = null;
    setTracking(false);
  };

  // Optional: auto-request on first load so UI can show status quickly
  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((r) => setPermission(r.status === "granted" ? "granted" : "denied"))
      .catch(() => {});
  }, []);

  return {
    permission,
    tracking,
    current,
    path,
    speedMps,
    totalMeters,
    start,
    stop,
    requestPermission,
  };
}