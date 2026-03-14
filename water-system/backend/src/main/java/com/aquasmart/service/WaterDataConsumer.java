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
import java.util.Optional;

@Service
public class WaterDataConsumer {

    private static final Logger log = LoggerFactory.getLogger(WaterDataConsumer.class);

    private final DeviceReadingRepository repository;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;

    // Default rate: $1.50 JMD per Liter
    private static final BigDecimal WATER_RATE_PER_LITER = new BigDecimal("1.50");

    public WaterDataConsumer(DeviceReadingRepository repository,
            UserAccountRepository userAccountRepository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.userAccountRepository = userAccountRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "water-sensor-data", groupId = "aquasmart-group")
    public void consume(String message) {
        log.info("=== KAFKA MESSAGE RECEIVED ===");
        log.info("Raw: {}", message);
        try {
            DeviceReading reading = objectMapper.readValue(message, DeviceReading.class);

            log.info("Parsed: deviceId={}, flowRate={}, tankLevel={}, supply={}, valve={}, leak={}",
                    reading.getDeviceId(), reading.getFlowRate(), reading.getTankLevel(),
                    reading.getSupplyType(), reading.getValveOpen(), reading.getLeakDetected());

            // Guard: deviceId is NOT NULL in DB - skip malformed messages
            if (reading.getDeviceId() == null || reading.getDeviceId().isBlank()) {
                log.error("SKIPPING: deviceId is null or blank in message: {}", message);
                return;
            }

            DeviceReading saved = repository.save(reading);
            log.info("SAVED TO DB: id={}, deviceId={}, flowRate={}, tankLevel={}",
                    saved.getId(), saved.getDeviceId(), saved.getFlowRate(), saved.getTankLevel());

            // --- PAY-AS-YOU-GO DEPLEPTION LOGIC ---
            processBilling(reading);

            if (Boolean.TRUE.equals(reading.getLeakDetected())) {
                log.warn("ALERT: Leak detected for device {}", reading.getDeviceId());
            }
        } catch (Exception e) {
            log.error("FAILED to process Kafka message. Raw message was: [{}]", message);
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            log.error("Full stack trace:", e);
        }
    }

    private void processBilling(DeviceReading reading) {
        Optional<UserAccount> accountOpt = userAccountRepository.findByDeviceId(reading.getDeviceId());
        if (accountOpt.isEmpty()) {
            log.info("No billing account found for device {}. Skipping depletion.", reading.getDeviceId());
            return;
        }

        UserAccount account = accountOpt.get();
        double flowRate = reading.getFlowRate(); // L/min

        if (flowRate > 0) {
            // Readings come every 2 seconds.
            // Liters used = flowRate * (2s / 60s)
            BigDecimal litersUsed = BigDecimal.valueOf(flowRate)
                    .multiply(BigDecimal.valueOf(2))
                    .divide(BigDecimal.valueOf(60), 6, RoundingMode.HALF_UP);

            BigDecimal cost = litersUsed.multiply(WATER_RATE_PER_LITER);
            account.deduct(cost);

            // Humanity Logic: Check if we've exceeded balance AND emergency credit
            BigDecimal totalAvailable = account.getBalance().add(account.getEmergencyCreditLimit());
            if (totalAvailable.compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("QUOTA EXCEEDED for device {}. Balance: {}, Limit: {}",
                        account.getDeviceId(), account.getBalance(), account.getEmergencyCreditLimit());
                account.setValveDisabledByBalance(true);
            }

            userAccountRepository.save(account);
            log.info("BILLING: Device {} used {}L. Cost: ${}. New Balance: ${}",
                    account.getDeviceId(), litersUsed, cost, account.getBalance());
        }
    }
}
