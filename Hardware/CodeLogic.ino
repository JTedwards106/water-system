/*
  AquaAudit JA - Smart Water Conservation
  Hack 26 ESP32 Actual Hardware Firmware

  Hardware Required:
  - ESP32 Development Board
  - YF-S201 Water Flow Sensor
  - 12V Solenoid Valve (driven via MOSFET/Relay)
  - Power Supply (12V for Valve + step-down to 5V/3.3V for ESP32)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

/* ===============================
   Configuration
=============================== */
// WiFi Settings
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend Settings
const char* serverUrl = "https://young-hornets-tell.loca.lt/api/v1/water/ingest";
String deviceId = "home-hw-001"; // Change to your preferred device ID

// Hardware Pins
const int FLOW_SENSOR_PIN = 14; // YF-S201 (Must support external interrupts)
const int VALVE_PIN = 12;       // Relay or MOSFET gate controlling the 12V Valve
const int STATUS_LED = 2;       // Onboard LED for status indication

// Timer intervals (sending data every X ms)
const unsigned long SYNC_INTERVAL_MS = 2000; 

/* ===============================
   Global State Variables
=============================== */
volatile int pulseCount = 0;   // Inremented via interrupt
float flowRateLPM = 0.0;       // Liters Per Minute
float totalLiters = 0.0;       // Accumulative Liters

unsigned long lastSyncTime = 0;
unsigned long lastFlowCalcTime = 0;

bool valveOpen = true;         // Relay default state
bool leakDetected = false;     // Derived from logic
bool forcedLeak = false;       // Remote command
String supplyType = "MAIN";    // Assuming Main for simple HW, or add Ultrasonic tank sensor

/* ===============================
   Interrupt Service Routine
=============================== */
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

/* ===============================
   Setup
=============================== */
void setup() {
  Serial.begin(115200);
  delay(1000); // Allow serial monitor to open
  Serial.println("\n--- AquaAudit JA ESP32 Hardware Boot ---");

  // Initialize Pins
  pinMode(STATUS_LED, OUTPUT);
  pinMode(VALVE_PIN, OUTPUT);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  
  // Attach Flow Sensor Interrupt (Falling Edge)
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  // Set initial valve state
  digitalWrite(VALVE_PIN, valveOpen ? HIGH : LOW);

  // Connect to WiFi
  Serial.print("[WIFI] Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED)); // Blink while connecting
  }
  
  digitalWrite(STATUS_LED, HIGH); // Solid ON when connected
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
    // Detach interrupt to ensure accurate reading
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));

    // For YF-S201: Pulse frequency (Hz) = 7.5Q, Q is flow rate in L/min.
    // Flow Rate (L/min) = Pulse Frequency / 7.5
    // And 1000ms is 1 second, so pulses in 1 sec = Hz.
    flowRateLPM = ((1000.0 / (currentTime - lastFlowCalcTime)) * pulseCount) / 7.5;
    
    // Calculate total milliliters and add to total liters
    float mL = (flowRateLPM / 60) * 1000;
    totalLiters += (mL / 1000.0);
    
    // Reset counters and timers
    pulseCount = 0;
    lastFlowCalcTime = currentTime;

    // Reattach interrupt
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

    // Simple leak detection logic
    if (flowRateLPM > 0.5 && !valveOpen) {
      leakDetected = true;
    } else {
      leakDetected = false;
    }

    // Print reading locally
    Serial.print("Flow: ");
    Serial.print(flowRateLPM);
    Serial.print(" L/min | Total: ");
    Serial.print(totalLiters);
    Serial.println(" L");
  }

  // 2. Sync to Backend Periodically
  if ((currentTime - lastSyncTime) >= SYNC_INTERVAL_MS) {
    if (WiFi.status() == WL_CONNECTED) {
      sendDataAndReceiveCommands();
    } else {
      Serial.println("[ERR] WiFi Disconnected!");
      // Optionally handle reconnection here
    }
    lastSyncTime = currentTime;
  }
}

/* ===============================
   Network Communication
=============================== */
void sendDataAndReceiveCommands() {
  WiFiClientSecure client;
  client.setInsecure(); // Bypass SSL Cert verification for Localtunnel / Development
  
  HTTPClient http;
  
  Serial.print("[SYNC] Sending to ");
  Serial.println(serverUrl);
  
  if (http.begin(client, serverUrl)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Bypass-Tunnel-Reminder", "true"); // Specifically for localtunnel if used
    
    // Build JSON Payload
    StaticJsonDocument<256> doc;
    doc["deviceId"]    = deviceId;
    doc["flowRate"]    = flowRateLPM;
    doc["tankLevel"]   = -1; // -1 or ignore if tracking live mains only
    doc["supplyType"]  = supplyType;
    doc["valveOpen"]   = valveOpen;
    doc["leakDetected"]= leakDetected;
    
    String jsonStr;
    serializeJson(doc, jsonStr);
    
    // Make POST Request
    int httpResponseCode = http.POST(jsonStr);
    
    if (httpResponseCode == 200) {
      Serial.println("[HTTP 200] Sync OK.");
      String response = http.getString();
      
      // Parse Response Commands
      StaticJsonDocument<512> resDoc;
      DeserializationError error = deserializeJson(resDoc, response);
      
      if (!error && resDoc.containsKey("commands")) {
        JsonObject cmds = resDoc["commands"];
        
        // Remote Valve Control
        if (cmds.containsKey("valveOpen")) {
          bool targetValve = cmds["valveOpen"];
          if (targetValve != valveOpen) {
            valveOpen = targetValve;
            // Write to Hardware Relay PIN
            // Note: Update logic based on whether your relay is Active-HIGH or Active-LOW
            digitalWrite(VALVE_PIN, valveOpen ? HIGH : LOW);
            Serial.print("[CMD] Valve Remote ");
            Serial.println(valveOpen ? "OPENED" : "CLOSED");
          }
        }
        
        // Handling forcedLeak (mostly for demo purposes)
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
