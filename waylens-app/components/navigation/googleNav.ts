export type HudTurn = "LEFT" | "RIGHT" | "STRAIGHT";

export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export type NavStep = {
  turn: HudTurn;
  distanceMeters: number;
  instruction: string;
};

const GOOGLE_MAPS_KEY = "ADD_YOUR_GOOGLE_MAPS_API_KEY_HERE";

export async function geocodeAddress(address: string): Promise<RoutePoint> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&key=${GOOGLE_MAPS_KEY}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.status !== "OK") {
    throw new Error("Failed to find location");
  }

  const loc = json.results[0].geometry.location;

  return {
    latitude: loc.lat,
    longitude: loc.lng,
  };
}

export async function getBikeRoute(origin: RoutePoint, destination: RoutePoint) {
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
      "X-Goog-FieldMask":
        "routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.maneuver,routes.legs.steps.navigationInstruction",
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: origin,
        },
      },
      destination: {
        location: {
          latLng: destination,
        },
      },
      travelMode: "BICYCLE",
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.routes?.length) {
    throw new Error("Route failed");
  }

  const route = json.routes[0];

  const steps: NavStep[] = route.legs[0].steps.map((s: any) => ({
    turn: mapTurn(s.maneuver),
    distanceMeters: s.distanceMeters,
    instruction: s.navigationInstruction?.instructions ?? "Go straight",
  }));

  const coords = decodePolyline(route.polyline.encodedPolyline);

  return { steps, coords };
}

function mapTurn(maneuver: string): HudTurn {
  const m = maneuver?.toLowerCase() || "";

  if (m.includes("left")) return "LEFT";
  if (m.includes("right")) return "RIGHT";
  return "STRAIGHT";
}

export function formatDistance(m: number) {
  const ft = m * 3.28;
  if (ft < 1000) return `${Math.round(ft)} ft`;
  return `${(ft / 5280).toFixed(1)} mi`;
}

function decodePolyline(encoded: string) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: RoutePoint[] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}