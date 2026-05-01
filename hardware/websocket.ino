#include <Arduino.h>
#include <SPI.h>
#include <U8g2lib.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// =========================
// WIFI
// =========================
const char* ssid = "add_your_wifi_ssid_here";
const char* password = "add_your_wifi_password_here";

// WebSocket server on port 81
WebSocketsServer webSocket = WebSocketsServer(81);

// =========================
// XIAO ESP32S3 OLED PINS
// =========================
static const uint8_t PIN_SCK  = D8;
static const uint8_t PIN_MOSI = D10;
static const uint8_t PIN_MISO = D9;
static const uint8_t PIN_CS   = D1;
static const uint8_t PIN_DC   = D2;
static const uint8_t PIN_RST  = D3;

// Vertical orientation
U8G2_SSD1309_128X64_NONAME0_F_4W_HW_SPI u8g2(U8G2_R1, PIN_CS, PIN_DC, PIN_RST);

// =========================
// HUD DATA
// =========================
// -1 = left, 0 = straight, +1 = right
int navTurn = 0;

// app sends formatted text like "350 ft" or "0.2 mi"
char distanceText[24] = "—";

// optional status
bool clientConnected = false;

// =========================
// ARROWS
// =========================
void drawStraightArrow(int cx, int cy) {
  u8g2.drawBox(cx - 2, cy - 10, 4, 14);
  u8g2.drawTriangle(cx, cy - 16, cx - 5, cy - 6, cx + 5, cy - 6);
}

void drawRightArrow(int cx, int cy) {
  u8g2.drawBox(cx - 2, cy - 10, 4, 8);
  u8g2.drawBox(cx, cy - 4, 6, 6);
  u8g2.drawBox(cx + 6, cy - 2, 10, 4);
  u8g2.drawTriangle(cx + 20, cy, cx + 12, cy - 6, cx + 12, cy + 6);
}

void drawLeftArrow(int cx, int cy) {
  u8g2.drawBox(cx - 2, cy - 10, 4, 8);
  u8g2.drawBox(cx - 6, cy - 4, 6, 6);
  u8g2.drawBox(cx - 16, cy - 2, 10, 4);
  u8g2.drawTriangle(cx - 20, cy, cx - 12, cy - 6, cx - 12, cy + 6);
}

// =========================
// OLED RENDERING
// =========================
void showCenteredText(const char* line1, const char* line2 = "", const char* line3 = "") {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x12_tf);

  int w1 = u8g2.getStrWidth(line1);
  int w2 = u8g2.getStrWidth(line2);
  int w3 = u8g2.getStrWidth(line3);

  int x1 = (u8g2.getDisplayWidth() - w1) / 2;
  int x2 = (u8g2.getDisplayWidth() - w2) / 2;
  int x3 = (u8g2.getDisplayWidth() - w3) / 2;

  u8g2.drawStr(x1, 16, line1);
  if (strlen(line2) > 0) u8g2.drawStr(x2, 32, line2);
  if (strlen(line3) > 0) u8g2.drawStr(x3, 48, line3);

  u8g2.sendBuffer();
}

void renderHUD() {
  u8g2.clearBuffer();

  const int screenW = u8g2.getDisplayWidth();
  const int screenH = u8g2.getDisplayHeight();

  // Distance text
  u8g2.setFont(u8g2_font_7x13_tf);
  int textWidth = u8g2.getStrWidth(distanceText);
  int distX = (screenW - textWidth) / 2;
  int distY = screenH - 6;

  u8g2.drawStr(distX, distY, distanceText);

  // Arrow
  int cx = screenW / 2;
  int cy = distY - 28;

  if (navTurn == 0) {
    drawStraightArrow(cx, cy);
  } else if (navTurn < 0) {
    drawLeftArrow(cx, cy);
  } else {
    drawRightArrow(cx, cy);
  }

  u8g2.sendBuffer();
}

// =========================
// JSON / PACKET HANDLING
// Expected packet from app:
// {
//   "t": "left",
//   "tm": "350 ft"
// }
// =========================
void handleHudPacket(uint8_t* payload, size_t length) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, length);

  if (err) {
    Serial.print("JSON parse failed: ");
    Serial.println(err.c_str());
    return;
  }

  if (doc.containsKey("t")) {
    String turn = String((const char*)doc["t"]);
    turn.toLowerCase();

    if (turn == "left") navTurn = -1;
    else if (turn == "right") navTurn = 1;
    else navTurn = 0;
  }

  if (doc.containsKey("tm")) {
    String dist = String((const char*)doc["tm"]);
    dist.toCharArray(distanceText, sizeof(distanceText));
  }

  Serial.print("TURN: ");
  Serial.print(navTurn);
  Serial.print(" | DIST: ");
  Serial.println(distanceText);

  renderHUD();
}

// =========================
// WEBSOCKET EVENTS
// =========================
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      clientConnected = false;
      Serial.printf("[WS] Client %u disconnected\n", num);
      showCenteredText("HUD Ready", "Client disconnected", WiFi.localIP().toString().c_str());
      break;

    case WStype_CONNECTED: {
      clientConnected = true;
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS] Client %u connected from %d.%d.%d.%d\n",
                    num, ip[0], ip[1], ip[2], ip[3]);

      showCenteredText("HUD Connected", "Waiting for data", WiFi.localIP().toString().c_str());
      break;
    }

    case WStype_TEXT:
      Serial.printf("[WS] Text: %.*s\n", (int)length, payload);
      handleHudPacket(payload, length);
      break;

    default:
      break;
  }
}

// =========================
// SETUP
// =========================
void setup() {
  Serial.begin(115200);
  delay(200);

  SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_CS);

  u8g2.begin();
  u8g2.setPowerSave(0);

  showCenteredText("WAYLENS HUD", "Booting...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  showCenteredText("Connecting WiFi", ssid);

  Serial.print("Connecting to: ");
  Serial.println(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  String ipStr = WiFi.localIP().toString();
  showCenteredText("WiFi Connected", ipStr.c_str(), "WS port 81");

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  Serial.println("WebSocket server started on port 81");

  delay(1200);
  renderHUD();
}

// =========================
// LOOP
// =========================
void loop() {
  webSocket.loop();
}