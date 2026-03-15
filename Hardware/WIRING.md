# AgriFlow ESP32 Node: Hardware Wiring Guide

This guide details the physical connections required to set up the AgriFlow water monitoring node using an ESP32, a flow sensor, and simulation LEDs.

## 1. Component List
*   **ESP32 DevKit V1** (or compatible 30/38 pin board)
*   **YF-S201 Water Flow Sensor** (5V Hall Effect)
*   **Simulation LED** (to represent the Solenoid Valve)
*   **Status LED** (optional, uses onboard Pin 2 by default)
*   **220Ω Resistor** (for the LED)
*   **Jumper Wires & Breadboard**

---

## 2. Wiring Diagram (Schematic)

```mermaid
graph TD
    ESP["ESP32 Development Board"]
    
    subgraph "Water Flow Sensor (YF-S201)"
        FS_R["Red Wire (VCC)"] --- ESP_5V["5V / VIN"]
        FS_B["Black Wire (GND)"] --- ESP_GND1["GND"]
        FS_Y["Yellow Wire (Signal)"] --- ESP_23["GPIO 23"]
    end
    
    subgraph "Multi-Status LEDs"
        ESP_11["GPIO 11"] --- LED_G["Green (Internet)"]
        ESP_10["GPIO 10"] --- LED_O["Orange (Valve/Switch)"]
        ESP_6["GPIO 6"]   --- LED_B["Blue (Flow Pulse)"]
    end
```

---

## 3. Connection Details

| Component Wire | ESP32 Pin | Function |
| :--- | :--- | :--- |
| **Flow Sensor: Yellow** | **GPIO 23** | **Signal (Input)**: Counts pulses per Liter. |
| **Green LED** | **GPIO 11** | **Internet Status**: Blinks slowly when synced. |
| **Orange LED** | **GPIO 10** | **Valve / Switch**: ON when valve is CLOSED or Light is ON. |
| **Blue LED** | **GPIO 6** | **Flow Pulse**: Instant flash for water flow. |

---

## 4. Pin Definition in `CodeLogic.ino`
If you need to change pins, update these lines at the top of the code:
```cpp
const int FLOW_SENSOR_PIN = 23; 
const int GREEN_LED_PIN   = 11; 
const int ORANGE_LED_PIN  = 10; 
const int BLUE_LED_PIN    = 6;  
```

---

## 5. Testing the Hardware
1. **Connect to USB**: Power the ESP32 through your computer.
2. **Open Serial Monitor**: Set baud rate to `115200`.
3. **Check Connection**: The onboard LED should blink until WiFi connects.
4. **Simulate Flow**: Blow air into the sensor. You should see "Flow: X L/min" in the serial monitor.
5. **Toggle Valve/Light**: Use the AgriFlow Mobile App to toggle the valve or the remote light switch. The **Orange LED on GPIO 10** should respond accordingly.

---

## 6. Power Considerations
*   **Development**: USB power is sufficient for the sensor and LEDs.
*   **Field Deployment**: Use a 12V power supply for the actual Solenoid Valve and a step-down converter (buck converter) to provide 5V to the ESP32.
