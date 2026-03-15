package com.aquasmart.controller;

import com.aquasmart.model.DeviceReading;

import com.aquasmart.repository.DeviceReadingRepository;
import com.aquasmart.repository.UserAccountRepository;
import com.aquasmart.service.WaterDataProducer;
import com.aquasmart.service.CommandService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/water")
@CrossOrigin(origins = "*")
public class WaterAnalyticsController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WaterAnalyticsController.class);

    private final DeviceReadingRepository repository;
    private final UserAccountRepository userAccountRepository;
    private final WaterDataProducer producer;
    private final CommandService commandService;
    private final ObjectMapper objectMapper;
    private volatile String lastReceivedData = "No data received yet.";

    public WaterAnalyticsController(DeviceReadingRepository repository,
            UserAccountRepository userAccountRepository,
            WaterDataProducer producer,
            CommandService commandService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.userAccountRepository = userAccountRepository;
        this.producer = producer;
        this.commandService = commandService;
        this.objectMapper = objectMapper;
    }

    @RequestMapping(value = "/ingest", method = { RequestMethod.GET, RequestMethod.POST })
    public ResponseEntity<String> ingestData(
            @RequestBody(required = false) String jsonData,
            HttpServletRequest request) {

        String method = request.getMethod();
        log.info("Incoming request: {} /api/v1/water/ingest", method);

        // Log all headers for debugging IoT connectivity
        String headers = Collections.list(request.getHeaderNames()).stream()
                .map(h -> h + ": " + request.getHeader(h))
                .collect(Collectors.joining(", "));
        log.info("Headers: [{}]", headers);

        if ("GET".equalsIgnoreCase(method)) {
            // User requested ONLY the data for easy verification
            return ResponseEntity.ok(lastReceivedData);
        }

        if (jsonData == null || jsonData.trim().isEmpty()) {
            log.warn("EMPTY POST BODY RECEIVED");
            return ResponseEntity.badRequest().body("Error: Empty request body");
        }

        log.info("RECEIVED RAW DATA: {}", jsonData);
        lastReceivedData = jsonData;

        try {
            // Validate JSON before sending to Kafka
            if (jsonData != null && !jsonData.trim().isEmpty()) {
                objectMapper.readTree(jsonData);
                // producer.sendMessage(jsonData);
            }

            // Prepare command response for bidirectional control
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ok");

            // Extract deviceId from incoming data
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(jsonData);
            String deviceId = node.has("deviceId") ? node.get("deviceId").asText() : "unknown";

            // --- AUTOMATIC SAFETY ENFORCEMENT ---
            enforceSafetyLimits(deviceId);

            Map<String, Object> commands = commandService.getAndClearCommands(deviceId);
            response.put("commands", commands);

            return ResponseEntity.ok(objectMapper.writeValueAsString(response));
        } catch (IOException e) {
            log.warn("JSON ERROR: {}", e.getMessage());
            return ResponseEntity.ok("{\"status\":\"error\",\"message\":\"JSON Error: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.warn("ERROR PROCESSING REQUEST: {}", e.getMessage());
            return ResponseEntity.ok("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/latest/{deviceId}")
    public List<DeviceReading> getLatestReadings(@PathVariable String deviceId) {
        List<DeviceReading> readings = repository.findByDeviceIdOrderByTimestampDesc(deviceId)
                .stream().limit(20).toList();

        // If no real data, return mock data for demo purposes
        if (readings.isEmpty()) {
            readings = createMockReadings(deviceId);
        }

        return readings;
    }

    private List<DeviceReading> createMockReadings(String deviceId) {
        List<DeviceReading> mockReadings = new java.util.ArrayList<>();
        long now = System.currentTimeMillis();

        for (int i = 0; i < 20; i++) {
            DeviceReading reading = new DeviceReading();
            reading.setDeviceId(deviceId);
            reading.setTimestamp(now - (i * 30000)); // 30 seconds apart
            reading.setFlowRate(15.0 + Math.random() * 10.0); // 15-25 L/min
            reading.setTankLevel((int)(75.0 + Math.random() * 20.0)); // 75-95%
            reading.setSupplyType("Municipal");
            reading.setValveOpen(true);
            reading.setLeakDetected(false);
            mockReadings.add(reading);
        }

        return mockReadings;
    }

    private List<Map<String, Object>> createMockHistory(String deviceId, int days) {
        List<Map<String, Object>> mockHistory = new java.util.ArrayList<>();
        long now = System.currentTimeMillis();
        java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("EEE HH:mm");

        // Create mock data for the last 'days' days, with hourly entries
        for (int i = 0; i < days * 24; i++) {
            long timestamp = now - (i * 60 * 60 * 1000); // 1 hour apart
            String hour = fmt.format(new java.util.Date(timestamp));
            double avgFlow = 15.0 + Math.random() * 10.0;
            double totalL = avgFlow * 2.0; // 2 hours worth
            double tankL = totalL * 0.7; // 70% from tank
            double mainL = totalL * 0.3; // 30% from main

            Map<String, Object> entry = Map.of(
                "hour", hour,
                "avgFlow", Math.round(avgFlow * 100.0) / 100.0,
                "totalL", Math.round(totalL * 100.0) / 100.0,
                "tankL", Math.round(tankL * 100.0) / 100.0,
                "mainL", Math.round(mainL * 100.0) / 100.0
            );
            mockHistory.add(entry);
        }

        return mockHistory;
    }

    @GetMapping("/history/{deviceId}")
    public List<Map<String, Object>> getHistory(@PathVariable String deviceId,
            @RequestParam(defaultValue = "7") int days) {
        long since = System.currentTimeMillis() - ((long) days * 24 * 60 * 60 * 1000);
        List<DeviceReading> readings = repository.findByDeviceIdOrderByTimestampDesc(deviceId)
                .stream()
                .filter(r -> r.getTimestamp() != null && r.getTimestamp() >= since)
                .toList();

        // If no real data, return mock history data for demo purposes
        if (readings.isEmpty()) {
            return createMockHistory(deviceId, days);
        }

        // Group by hour label, summary of stats including supply breakdown
        java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("EEE HH:mm");
        Map<String, Map<String, Object>> hourlyStats = new java.util.LinkedHashMap<>();

        for (DeviceReading r : readings) {
            String hour = fmt.format(new java.util.Date(r.getTimestamp()));
            Map<String, Object> stats = hourlyStats.computeIfAbsent(hour, k -> {
                Map<String, Object> s = new HashMap<>();
                s.put("sumFlow", 0.0);
                s.put("count", 0);
                s.put("tankSum", 0.0);
                s.put("mainSum", 0.0);
                return s;
            });

            double flow = (r.getFlowRate() != null) ? r.getFlowRate() : 0.0;
            stats.put("sumFlow", (double) stats.get("sumFlow") + flow);
            stats.put("count", (int) stats.get("count") + 1);

            double literContribution = flow * (2.0 / 60.0);
            if ("MAIN".equalsIgnoreCase(r.getSupplyType())) {
                stats.put("mainSum", (double) stats.get("mainSum") + literContribution);
            } else {
                stats.put("tankSum", (double) stats.get("tankSum") + literContribution);
            }
        }

        return hourlyStats.entrySet().stream()
                .map(e -> {
                    Map<String, Object> s = e.getValue();
                    double avgFlow = (int) s.get("count") > 0 ? (double) s.get("sumFlow") / (int) s.get("count") : 0.0;
                    double tankL = (double) s.get("tankSum");
                    double mainL = (double) s.get("mainSum");
                    return Map.<String, Object>of(
                            "hour", e.getKey(),
                            "avgFlow", Math.round(avgFlow * 100.0) / 100.0,
                            "totalL", Math.round((tankL + mainL) * 100.0) / 100.0,
                            "tankL", Math.round(tankL * 100.0) / 100.0,
                            "mainL", Math.round(mainL * 100.0) / 100.0);
                })
                .limit(48)
                .toList();
    }

    @PostMapping("/command")
    public ResponseEntity<String> setCommand(
            @RequestParam String deviceId,
            @RequestParam String command,
            @RequestParam String value) {

        // Try to parse boolean if it's true/false, otherwise store as string
        Object parsedValue = value;
        if ("true".equalsIgnoreCase(value))
            parsedValue = true;
        else if ("false".equalsIgnoreCase(value))
            parsedValue = false;

        commandService.setCommand(deviceId, command, parsedValue);

        log.info("Command SET for {}: {} = {}", deviceId, command, parsedValue);
        return ResponseEntity.ok("Command scheduled");
    }

    @PostMapping("/valve")
    public String toggleValve(@RequestParam String deviceId, @RequestParam boolean open) {
        setCommand(deviceId, "valveOpen", open ? "true" : "false");
        log.info("Valve command for {}: {}", deviceId, open ? "OPEN" : "CLOSED");
        return "Valve status for " + deviceId + " set to " + (open ? "OPEN" : "CLOSED");
    }

    @PostMapping("/light")
    public String toggleLight(@RequestParam String deviceId, @RequestParam boolean on) {
        setCommand(deviceId, "lightOn", on ? "true" : "false");
        log.info("Light command for {}: {}", deviceId, on ? "ON" : "OFF");
        return "Light for " + deviceId + " set to " + (on ? "ON" : "OFF");
    }

    @PostMapping("/leak")
    public String toggleLeak(@RequestParam String deviceId, @RequestParam boolean active) {
        setCommand(deviceId, "forcedLeak", active ? "true" : "false");
        return "Leak simulation for " + deviceId + " set to " + (active ? "ACTIVE" : "OFF");
    }

    private void enforceSafetyLimits(String deviceId) {
        userAccountRepository.findByDeviceId(deviceId).ifPresent(account -> {
            // 1. Balance Check
            if (account.isValveDisabledByBalance()) {
                log.warn("ENFORCING SHUTOFF for device {} due to low balance.", deviceId);
                commandService.setCommand(deviceId, "valveOpen", false);
            }
            
            // 2. Target Reach Check (Ensures zero-latency shutoff even if Kafka is slow)
            if (account.isTargetReached()) {
                log.warn("ENFORCING SHUTOFF for device {} due to water target reached.", deviceId);
                commandService.setCommand(deviceId, "valveOpen", false);
            }
        });
    }
}
