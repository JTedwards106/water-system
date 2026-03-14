const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// Endpoint to receive sensor data from Wokwi/ESP32
exports.sensorData = onRequest(async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    const data = req.body;
    const { deviceId, flowRate, tankLevel, valveOpen, leakDetected, timestamp } = data;

    if (!deviceId) {
        res.status(400).send("Missing deviceId");
        return;
    }

    try {
        const db = admin.firestore();
        const rtdb = admin.database();

        // 1. Update Current Device State (Firestore)
        await db.collection("devices").doc(deviceId).set({
            flowRate,
            tankLevel,
            valveOpen,
            leakDetected,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 2. Log History (Firestore)
        await db.collection("readings").add({
            deviceId,
            flowRate,
            tankLevel,
            valveOpen,
            leakDetected,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. Update Realtime DB for live dashboard feed
        await rtdb.ref(`live/${deviceId}`).set({
            flowRate,
            tankLevel,
            valveOpen,
            leakDetected,
            timestamp: Date.now()
        });

        // 4. Handle Alerts
        if (leakDetected) {
            await db.collection("alerts").add({
                deviceId,
                type: "LEAKAGE",
                message: `High flow detected on ${deviceId} while valve is closed!`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                resolved: false
            });
        }

        if (tankLevel < 15) {
            await db.collection("alerts").add({
                deviceId,
                type: "LOW_TANK",
                message: `Critical water level (${tankLevel}%) on ${deviceId}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                resolved: false
            });
        }

        logger.info(`Data received for ${deviceId}`, { structuredData: true });
        res.status(200).send({ status: "success", deviceId });
    } catch (error) {
        logger.error("Error saving sensor data", error);
        res.status(500).send("Internal Server Error");
    }
});

// Endpoint to control the valve from Web/Mobile
exports.controlValve = onRequest(async (req, res) => {
    const { deviceId, open } = req.body;

    if (!deviceId || typeof open !== "boolean") {
        res.status(400).send("Invalid parameters");
        return;
    }

    try {
        const db = admin.firestore();

        // Update the desired state in Firestore
        // The ESP32 can poll this or we can use a Realtime DB flag for instant push
        await db.collection("devices").doc(deviceId).update({
            valveOpen: open,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).send({ status: "success", valveOpen: open });
    } catch (error) {
        logger.error("Error updating valve state", error);
        res.status(500).send("Internal Server Error");
    }
});
