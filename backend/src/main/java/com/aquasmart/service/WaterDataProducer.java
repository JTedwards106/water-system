package com.aquasmart.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class WaterDataProducer {

    private static final Logger log = LoggerFactory.getLogger(WaterDataProducer.class);
    private static final String TOPIC = "water-sensor-data";

    private final KafkaTemplate<String, String> kafkaTemplate;

    public WaterDataProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(String message) {
        log.info("Producing message to Kafka: {}", message);
        // this.kafkaTemplate.send(TOPIC, message);
        log.info("KAFKA BYPASS: Message logged but not sent to Kafka");
    }
}
