/*
  AgriFlow - 3 LED Blinking Test
  Green LED  -> GPIO 11
  Orange LED -> GPIO 10
  Blue LED   -> GPIO 9
*/

const int GREEN_LED_PIN = 11;
const int ORANGE_LED_PIN = 10;
const int BLUE_LED_PIN = 9;

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- 3 LED Blinking Test ---");

  // Configure pins as outputs
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(ORANGE_LED_PIN, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);
}

void loop() {
  // Turn all ON
  digitalWrite(GREEN_LED_PIN, HIGH);
  digitalWrite(ORANGE_LED_PIN, HIGH);
  digitalWrite(BLUE_LED_PIN, HIGH);
  Serial.println("All LEDs ON");
  delay(1000); // Wait 1 second

  // Turn all OFF
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(ORANGE_LED_PIN, LOW);
  digitalWrite(BLUE_LED_PIN, LOW);
  Serial.println("All LEDs OFF");
  delay(1000); // Wait 1 second
}

