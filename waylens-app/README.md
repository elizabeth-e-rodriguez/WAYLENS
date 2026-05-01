# WAYLENS Mobile App

This is the React Native (Expo) mobile application for WAYLENS.

It handles GPS tracking, route generation, and sends navigation data to the smart glasses in real time.

---

## What This App Does

- Gets user location using GPS
- Generates routes using Google Maps APIs
- Extracts turn-by-turn navigation steps
- Sends simplified navigation data (direction + distance) to the ESP32 over WebSocket

---

## Tech Stack

- React Native (Expo)
- TypeScript / JavaScript
- Expo Location
- Expo Router
- AsyncStorage
- Google Maps APIs (Geocoding + Directions)

---

## Getting Started

### Install dependencies
```bash
npm install
npm expo start
```
### Adding your Google Maps API Key
- Geocoding API is enabled
- Routing API is enabled

### Notes:
- Designed for Android testing 
- Requires location permissions
- Optimized for real-time outdoor navigation