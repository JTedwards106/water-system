# AquaSmart Demo Launch Guide 🚀

Follow these steps in order to launch the full AquaSmart ecosystem for your demo.

## 1. Start the Backend (Brain)
The backend manages data, AI logic, and commands. 
**Note**: If you get an error about `JAVA_HOME`, run the "Fix" command first.

```powershell
cd backend
# Run this if JAVA_HOME error occurs:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-23"
.\mvnw.cmd spring-boot:run
```
- **Port**: `8081` (Check [http://localhost:8081/api/v1/water/ingest](http://localhost:8081/api/v1/water/ingest))
- **Ready when**: You see `partitions assigned: [water-sensor-data-0]`. 
  > **IMPORTANT**: The terminal will stop logging after this. This is **GOOD**! Do not close it or press Ctrl+C—it means the brain is alive and listening! 🧠✨

## 2. Start the Web Dashboard (Eyes)
The web app shows real-time graphs and controls.
```powershell
cd web
npm run dev
```
- **Check**: Open the local URL (usually `http://localhost:5173`) in your browser.

## 3. Start the Mobile App (Portable Control)
The Expo app for mobile testing.
```powershell
cd Mobile
npx expo start --tunnel --clear
```
- **Action**: Scan the QR code with the **Expo Go** app on your phone.

## 4. Hardware Setup (Muscle)
1. Open `Hardware/CodeLogic.ino` in **Arduino IDE**.
2. Update the `ssid` and `password` with your current WiFi credentials.
3. Select board: **ESP32 Dev Module**.
4. Click **Upload**.
5. Once uploaded, open the **Serial Monitor** (115200 baud) to see the sync status.

---

### Troubleshooting
- **Database**: Ensure your PostgreSQL service is running.
- **Tunnel**: If you are using `localtunnel`, make sure it's active so the Hardware can find the Backend.
- **CORS**: I have configured the backend to allow all origins, so you should see data flowing immediately.
