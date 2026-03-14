package com.aquasmart.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HealthController {

    private final com.aquasmart.repository.UserAccountRepository userAccountRepository;
    private final com.aquasmart.repository.UserRepository userRepository;

    public HealthController(com.aquasmart.repository.UserAccountRepository userAccountRepository,
            com.aquasmart.repository.UserRepository userRepository) {
        this.userAccountRepository = userAccountRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/")
    public String health() {
        return "AquaSmart Backend is Online and Ready!";
    }

    @GetMapping("/api/health")
    public String apiHealth() {
        return "API Layer is reachable";
    }

    @GetMapping("/api/debug/state")
    public Map<String, Object> getDebugState() {
        return Map.of(
                "meterCount", userAccountRepository.count(),
                "userCount", userRepository.count(),
                "meters", userAccountRepository.findAll());
    }
}
