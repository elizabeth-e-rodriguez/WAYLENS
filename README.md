# WAYPOINT
WAYPOINT is a HUD-based smart sunglasses prototype for cycling and hiking. It displays navigation, speed, and distance using a transparent OLED inside the glasses, paired with an Android app that handles GPS, routing, and trail selection for hands-free outdoor navigation.

---
## Project Overview

WAYPOINT is made up of two main parts:

- **Smart Glasses (Hardware)**
  - Uses an ESP32-S3 microcontroller and a transparent OLED display
  - Receives navigation data from the mobile app over Bluetooth
  - Displays simple text and icons (arrows, distance, speed) as a HUD

- **Mobile App (Frontend)**
  - Built using React
  - Handles GPS, navigation, and trail search
  - Allows users to switch between cycling and hiking modes
  - Sends navigation data to the glasses in real time
---

## Supplies / Hardware Used

- **Seeed Studio XIAO ESP32-S3**
  - Dual-core microcontroller with BLE and built-in battery charging
- **1.51" Transparent OLED Display (128×64)**
  - Used to display HUD text and icons
- **3.7V LiPo Battery**
  - Powers the ESP32 and display
- **Dupont Jumper Wires**
  - Used for wiring components during prototyping
- **Sport Sunglasses Frame**
  - Used to mount the OLED and electronics
- **Adhesive Mirror Sheet (Reflective Film)**
  - Reflects the OLED image into the user’s eye to create the HUD effect
- **Basic Mounting Supplies**
  - Double-sided tape, heat shrink tubing, etc.

---
