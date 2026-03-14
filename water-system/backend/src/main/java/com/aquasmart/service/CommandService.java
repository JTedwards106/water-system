package com.aquasmart.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CommandService {

    private static final Logger log = LoggerFactory.getLogger(CommandService.class);

    // deviceId -> (commandName -> value)
    private final Map<String, Map<String, Object>> pendingCommands = new ConcurrentHashMap<>();

    public void setCommand(String deviceId, String command, Object value) {
        log.info("Queuing command for {}: {} = {}", deviceId, command, value);
        pendingCommands.computeIfAbsent(deviceId, k -> new ConcurrentHashMap<>())
                .put(command, value);
    }

    public Map<String, Object> getAndClearCommands(String deviceId) {
        // Retrieve commands and clear for this device since it's polling
        Map<String, Object> commands = pendingCommands.remove(deviceId);
        return commands != null ? commands : new HashMap<>();
    }

    public Map<String, Object> peekCommands(String deviceId) {
        return pendingCommands.getOrDefault(deviceId, new HashMap<>());
    }
}
