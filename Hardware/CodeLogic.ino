/*
  AgriFlow - Smart Water Management
  Hackathon 2026 ESP32 Hardware Firmware
  (Valve Simulation Mode with LED Indicators & Remote Switch)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "secrets.h"

/* ===============================
   Configuration
=============================== */
// Credentials from secrets.h
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// Backend Settings
const char* serverUrl = "https://aquasmart-fresh-start.loca.lt/api/v1/water/ingest";
String deviceId = AGRIFLOW_DEVICE_ID; 

// Hardware Pins
const int FLOW_SENSOR_PIN = 23; // YF-S201 (Yellow Signal Wire)
const int GREEN_LED_PIN   = 11; // Internet status
const int ORANGE_LED_PIN  = 10; // Valve / leakage indicator
const int BLUE_LED_PIN    = 6;  // Flow indicator
const int LIGHT_PIN       = 4;  // Indicator LED / Switch (controlled remotely)

// Timer intervals
const unsigned long SYNC_INTERVAL_MS = 2000;

/* ===============================
   Global State Variables
=============================== */
volatile int pulseCount = 0;
float flowRateLPM = 0.0;
float totalLiters = 0.0;

unsigned long lastSyncTime = 0;
unsigned long lastFlowCalcTime = 0;

bool valveOpen = true;
bool leakDetected = false;
bool forcedLeak = false;
bool lightOn = false;
String supplyType = "MAIN";

// LED timing
unsigned long lastFlowPulseTime = 0;
const unsigned long FLOW_LED_TIMEOUT = 500;
unsigned long lastLeakBlinkTime = 0;
const unsigned long LEAK_BLINK_INTERVAL = 700;
unsigned long lastGreenBlink = 0;
const unsigned long GREEN_BLINK_INTERVAL = 1000;

// Debounce for flow sensor
volatile unsigned long lastPulseISR = 0;

/* ===============================
   Helper: Apply valve state to Orange LED immediately
   - Valve OPEN  → Orange LED OFF
   - Valve CLOSED → Orange LED ON (steady; blink handled in loop if leak)
=============================== */
void applyValveToLED() {
  if (valveOpen) {
    digitalWrite(ORANGE_LED_PIN, LOW);  // Valve open → orange OFF
  } else {
    digitalWrite(ORANGE_LED_PIN, HIGH); // Valve closed → orange ON
  }
}

/* ===============================
   Interrupt Service Routine
=============================== */
void IRAM_ATTR pulseCounter() {
  unsigned long now = micros();
  if (now - lastPulseISR > 2000) {
    pulseCount++;
    lastFlowPulseTime = millis();
    digitalWrite(BLUE_LED_PIN, HIGH); // instant ON on pulse
  }
  lastPulseISR = now;
}

/* ===============================
   Setup
=============================== */
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- AgriFlow ESP32 Node Boot ---");
  Serial.print("Device ID: ");
  Serial.println(deviceId);

  // Initialize Pins
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(ORANGE_LED_PIN, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);

  // Set initial states
  applyValveToLED(); // Orange OFF on boot (valve open by default)
  digitalWrite(LIGHT_PIN, lightOn ? HIGH : LOW);

  // Attach Flow Sensor Interrupt (permanent)
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  // Connect to WiFi
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    digitalWrite(GREEN_LED_PIN, LOW);
  }
  Serial.println("\n[WIFI] Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

/* ===============================
   Main Loop
=============================== */
void loop() {
  unsigned long currentTime = millis();

  // 1. Calculate Flow Rate every 1 second
  if ((currentTime - lastFlowCalcTime) >= 1000) {
    flowRateLPM = ((1000.0 / (currentTime - lastFlowCalcTime)) * pulseCount) / 7.5;
    float mL = (flowRateLPM / 60) * 1000;
    totalLiters += (mL / 1000.0);

    pulseCount = 0;
    lastFlowCalcTime = currentTime;

    // Leak detection: water flowing but valve is closed
    leakDetected = (flowRateLPM > 0.5 && !valveOpen);

    Serial.print("Flow: ");
    Serial.print(flowRateLPM);
    Serial.print(" L/min | Total: ");
    Serial.print(totalLiters);
    Serial.println(" L");
  }

  // 2. Independent LED Logic

  // Blue LED: OFF if no pulse for FLOW_LED_TIMEOUT
  if ((millis() - lastFlowPulseTime) > FLOW_LED_TIMEOUT) {
    digitalWrite(BLUE_LED_PIN, LOW);
  }

  // Orange LED:
  //   Valve OPEN         → OFF
  //   Valve CLOSED + OK  → Steady ON
  //   Valve CLOSED + LEAK→ Fast blink
  if (!valveOpen) {
    if (leakDetected) {
      if ((millis() - lastLeakBlinkTime) >= LEAK_BLINK_INTERVAL) {
        digitalWrite(ORANGE_LED_PIN, !digitalRead(ORANGE_LED_PIN));
        lastLeakBlinkTime = millis();
      }
    } else {
      digitalWrite(ORANGE_LED_PIN, HIGH); // Steady ON: valve closed, no leak
    }
  } else {
    digitalWrite(ORANGE_LED_PIN, LOW); // Valve open: orange OFF
  }

  // Green LED: blink when connected, OFF when disconnected
  if (WiFi.status() == WL_CONNECTED) {
    if ((millis() - lastGreenBlink) >= GREEN_BLINK_INTERVAL) {
      digitalWrite(GREEN_LED_PIN, !digitalRead(GREEN_LED_PIN));
      lastGreenBlink = millis();
    }
  } else {
    digitalWrite(GREEN_LED_PIN, LOW);
  }

  // 3. Sync to Backend Periodically
  if ((currentTime - lastSyncTime) >= SYNC_INTERVAL_MS) {
    if (WiFi.status() == WL_CONNECTED) {
      sendDataAndReceiveCommands();
    } else {
      Serial.println("[ERR] WiFi Disconnected!");
    }
    lastSyncTime = currentTime;
  }
}

/* ===============================
   Network Communication
   
   SENDS:
   {
     "deviceId": "AGRIFLOW_001",
     "flowRate": 5.5,
     "tankLevel": -1,
     "supplyType": "MAIN",
     "valveOpen": true,
     "leakDetected": false
   }

   RECEIVES:
   {
     "status": "ok",
     "commands": {
       "valveOpen": false,   // optional
       "lightOn": true,      // optional
       "forcedLeak": false   // optional
     }
   }
=============================== */
void sendDataAndReceiveCommands() {
  WiFiClientSecure client;
  client.setInsecure(); // Dev mode: bypass SSL cert check for localtunnel

  HTTPClient http;

  Serial.print("[SYNC] Sending to ");
  Serial.println(serverUrl);

  if (http.begin(client, serverUrl)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Bypass-Tunnel-Reminder", "true"); // Required for localtunnel

    // Build outgoing sensor payload
    StaticJsonDocument<256> doc;
    doc["deviceId"]     = deviceId;
    doc["flowRate"]     = flowRateLPM;
    doc["tankLevel"]    = -1;
    doc["supplyType"]   = supplyType;
    doc["valveOpen"]    = valveOpen;
    doc["leakDetected"] = leakDetected;

    String jsonStr;
    serializeJson(doc, jsonStr);

    int httpResponseCode = http.POST(jsonStr);

    if (httpResponseCode == 200) {
      Serial.println("[HTTP 200] Sync OK.");
      String response = http.getString();

      // Parse commands from backend response
      StaticJsonDocument<512> resDoc;
      DeserializationError error = deserializeJson(resDoc, response);

      if (!error && resDoc.containsKey("commands")) {
        JsonObject cmds = resDoc["commands"];

        // --- Valve Control ---
        // Turns orange LED OFF if valve opens, ON if valve closes
        if (cmds.containsKey("valveOpen")) {
          bool targetValve = cmds["valveOpen"];
          if (targetValve != valveOpen) {
            valveOpen = targetValve;
            applyValveToLED(); // Immediate orange LED update on remote command
            Serial.print("[CMD] Valve state changed: ");
            Serial.println(valveOpen ? "OPEN" : "CLOSED");
          }
        }

        // --- Light / Remote Switch Control ---
        // Controls LIGHT_PIN (GPIO 4) - connect your LED or relay here
        if (cmds.containsKey("lightOn")) {
          bool targetLight = cmds["lightOn"];
          if (targetLight != lightOn) {
            lightOn = targetLight;
            digitalWrite(LIGHT_PIN, lightOn ? HIGH : LOW);
            Serial.print("[CMD] Light/Switch Remote ");
            Serial.println(lightOn ? "ON" : "OFF");
          }
        }

        // --- Forced Leak Simulation (demo only) ---
        if (cmds.containsKey("forcedLeak")) {
          forcedLeak = cmds["forcedLeak"];
        }
      }
    } else {
      Serial.print("[HTTP ERROR] Code: ");
      Serial.println(httpResponseCode);
      Serial.println(http.getString());
    }
    http.end();
  } else {
    Serial.println("[ERR] Unable to connect to server");
  }
}
