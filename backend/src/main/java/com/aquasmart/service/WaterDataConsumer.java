package com.aquasmart.service;

import com.aquasmart.model.DeviceReading;
import com.aquasmart.model.UserAccount;
import com.aquasmart.repository.DeviceReadingRepository;
import com.aquasmart.repository.UserAccountRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class WaterDataConsumer {

    private static final Logger log = LoggerFactory.getLogger(WaterDataConsumer.class);

    private final DeviceReadingRepository repository;
    private final UserAccountRepository userAccountRepository;
    private final SnowflakeService snowflakeService;
    private final AIService aiService;
    private final WaterDataProducer producer;
    private final CommandService commandService;
    private final ObjectMapper objectMapper;

    // Default rate: $1.50 JMD per Liter
    private static final BigDecimal WATER_RATE_PER_LITER = new BigDecimal("1.50");

    public WaterDataConsumer(DeviceReadingRepository repository,
            UserAccountRepository userAccountRepository,
            SnowflakeService snowflakeService,
            AIService aiService,
            WaterDataProducer producer,
            CommandService commandService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.userAccountRepository = userAccountRepository;
        this.snowflakeService = snowflakeService;
        this.aiService = aiService;
        this.producer = producer;
        this.commandService = commandService;
        this.objectMapper = objectMapper;
    }

    // @KafkaListener(topics = "water-sensor-data", groupId = "aquasmart-group")
    // public void consume(String message) {
    //     log.info("=== KAFKA MESSAGE RECEIVED ===");
    //     log.info("Raw: {}", message);
    //     try {
    //         DeviceReading reading = objectMapper.readValue(message, DeviceReading.class);

    //         log.info("Parsed: deviceId={}, flowRate={}, tankLevel={}, supply={}, valve={}, leak={}",
    //                 reading.getDeviceId(), reading.getFlowRate(), reading.getTankLevel(),
    //                 reading.getSupplyType(), reading.getValveOpen(), reading.getLeakDetected());

    //         // Guard: deviceId is NOT NULL in DB - skip malformed messages
    //         if (reading.getDeviceId() == null || reading.getDeviceId().isBlank()) {
    //             log.error("SKIPPING: deviceId is null or blank in message: {}", message);
    //             return;
    //         }

    //         DeviceReading saved = repository.save(reading);
    //         log.info("SAVED TO DB: id={}, deviceId={}, flowRate={}, tankLevel={}",
    //                 saved.getId(), saved.getDeviceId(), saved.getFlowRate(), saved.getTankLevel());

    //         // --- SNOWFLAKE SINK (Skipped for MVP) ---
    //         // snowflakeService.sinkReading(reading);

    //         // --- AI PREDICTION LOOP ---
    //         if (aiService.shouldShutOff(reading)) {
    //             log.info("AI Triggered SHUTOFF for device {}", reading.getDeviceId());
    //             // Queue the command for the next poll
    //             commandService.setCommand(reading.getDeviceId(), "valveOpen", false);
                
    //             // Safe JSON construction for Kafka notification
    //             try {
    //                 Map<String, Object> aiAlert = new java.util.HashMap<>();
    //                 aiAlert.put("deviceId", reading.getDeviceId());
    //                 aiAlert.put("command", "valveOpen");
    //                 aiAlert.put("value", false);
    //                 aiAlert.put("source", "AI");
    //                 producer.sendMessage(objectMapper.writeValueAsString(aiAlert));
    //             } catch (Exception e) {
    //                 log.error("Failed to send AI shutoff notification: {}", e.getMessage());
    //             }
    //         }

    //         // --- PAY-AS-YOU-GO DEPLEPTION LOGIC ---
    //         processBilling(reading);

    //         if (Boolean.TRUE.equals(reading.getLeakDetected())) {
    //             log.warn("ALERT: Leak detected for device {}", reading.getDeviceId());
    //         }
    //     } catch (Exception e) {
    //         log.error("FAILED to process Kafka message. Raw message was: [{}]", message);
    //         log.error("Exception type: {}", e.getClass().getName());
    //         log.error("Exception message: {}", e.getMessage());
    //         log.error("Full stack trace:", e);
    //     }
    // }

    private void processBilling(DeviceReading reading) {
        Optional<UserAccount> accountOpt = userAccountRepository.findByDeviceId(reading.getDeviceId());
        UserAccount account;
        if (accountOpt.isPresent()) {
            account = accountOpt.get();
        } else {
            log.info("AUTO-PROVISIONING: Creating default account for new device {}", reading.getDeviceId());
            account = UserAccount.builder()
                    .deviceId(reading.getDeviceId())
                    .ownerName("Auto-Discovery (" + reading.getDeviceId() + ")")
                    .premiseId("AUTO-" + reading.getDeviceId().toUpperCase())
                    .balance(new BigDecimal("100.00")) // Grace start
                    .emergencyCreditLimit(new BigDecimal("50.00"))
                    .targetAmount(new BigDecimal("10.00")) // Default 10L target
                    .valveDisabledByBalance(false)
                    .build();
            userAccountRepository.save(account);
        }

        double flowRate = reading.getFlowRate(); // L/min

        if (flowRate > 0) {
            // Readings come every 2 seconds.
            // Liters used = flowRate * (2s / 60s)
            BigDecimal litersUsed = BigDecimal.valueOf(flowRate)
                    .multiply(BigDecimal.valueOf(2))
                    .divide(BigDecimal.valueOf(60), 6, RoundingMode.HALF_UP);

            BigDecimal cost = litersUsed.multiply(WATER_RATE_PER_LITER);
            account.trackUsage(litersUsed);
            account.deduct(cost);

            // Humanity Logic: Check if we've exceeded balance AND emergency credit
            BigDecimal totalAvailable = account.getBalance().add(account.getEmergencyCreditLimit());
            if (totalAvailable.compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("QUOTA EXCEEDED for device {}. Balance: {}, Limit: {}",
                        account.getDeviceId(), account.getBalance(), account.getEmergencyCreditLimit());
                account.setValveDisabledByBalance(true);
                // Also trigger hardware shutoff
                commandService.setCommand(account.getDeviceId(), "valveOpen", false);
            }

            // --- MVP TARGET USAGE LOGIC ---
            if (account.isTargetReached()) {
                log.warn("TARGET REACHED for device {}. Usage: {}, Target: {}",
                        account.getDeviceId(), account.getCumulativeUsage(), account.getTargetAmount());
                // Force shutoff
                commandService.setCommand(account.getDeviceId(), "valveOpen", false);
                // Notify via Kafka for dashboard "WOW" factor
                try {
                    Map<String, Object> targetReachedAlert = new java.util.HashMap<>();
                    targetReachedAlert.put("deviceId", account.getDeviceId());
                    targetReachedAlert.put("status", "TARGET_REACHED");
                    targetReachedAlert.put("usage", account.getCumulativeUsage());
                    // producer.sendMessage(objectMapper.writeValueAsString(targetReachedAlert));
                } catch (Exception e) {
                    log.error("Failed to send target reached notification: {}", e.getMessage());
                }
            }

            userAccountRepository.save(account);
            log.info("BILLING: Device {} used {}L. Cost: ${}. New Balance: ${}",
                    account.getDeviceId(), litersUsed, cost, account.getBalance());
        }
    }
}
