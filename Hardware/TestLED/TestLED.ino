/*
  AgriFlow - ESP32 LED ON Test
  Testing Green LED on GPIO 26
*/

const int GREEN_LED_PIN =11;  // Green LED Anode (+) → GPIO 26
                               // Cathode (-) → 100Ω resistor → GND

void setup() {
  // Start serial monitor
  Serial.begin(115200);
  Serial.println("\n--- Green LED ON Test ---");

  // Configure pin as output
  pinMode(GREEN_LED_PIN, OUTPUT);

  // Turn LED ON once
  digitalWrite(GREEN_LED_PIN, HIGH);
  Serial.println("Green LED is ON");
}

void loop() {
  // Nothing here, LED stays ON
}
