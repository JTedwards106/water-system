package com.aquasmart.service;

import com.aquasmart.model.DeviceReading;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    /**
     * Predicts whether the device should be shut off based on usage patterns.
     * In a real system, this would call an external ML model or run inference.
     */
    public boolean shouldShutOff(DeviceReading reading) {
        log.info("Running AI prediction for device: {}", reading.getDeviceId());
        
        // If valve is already closed, no need to predict a shutoff
        if (Boolean.FALSE.equals(reading.getValveOpen())) {
            return false;
        }

        // Mock Logic: If flow rate is high (> 40 L/min) and tank level is low (< 20%), 
        // predict that we should shut off to conserve.
        if (reading.getFlowRate() != null && reading.getFlowRate() > 40.0 && 
            reading.getTankLevel() != null && reading.getTankLevel() < 20.0) {
            log.warn("AI PREDICTION: Potential water waste detected! Recommending SHUTOFF.");
            return true;
        }
        
        return false;
    }
}
