package com.aquasmart.service;

import com.aquasmart.model.DeviceReading;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.Properties;

@Service
public class SnowflakeService {

    private static final Logger log = LoggerFactory.getLogger(SnowflakeService.class);

    @Value("${spring.snowflake.url}")
    private String url;

    @Value("${spring.snowflake.user}")
    private String user;

    @Value("${spring.snowflake.password}")
    private String password;

    @Value("${spring.snowflake.database}")
    private String database;

    @Value("${spring.snowflake.schema}")
    private String schema;

    @Value("${spring.snowflake.warehouse}")
    private String warehouse;

    @Value("${spring.snowflake.role}")
    private String role;

    public void sinkReading(DeviceReading reading) {
        log.info("Sinking reading to Snowflake for device: {}", reading.getDeviceId());
        
        Properties properties = new Properties();
        properties.put("user", user);
        properties.put("password", password);
        properties.put("db", database);
        properties.put("schema", schema);
        properties.put("warehouse", warehouse);
        properties.put("role", role);

        String sql = "INSERT INTO FLOW_HISTORY (DEVICE_ID, FLOW_RATE, TANK_LEVEL, SUPPLY_TYPE, VALVE_OPEN, LEAK_DETECTED, TIMESTAMP) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DriverManager.getConnection(url, properties);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, reading.getDeviceId());
            pstmt.setDouble(2, reading.getFlowRate() != null ? reading.getFlowRate() : 0.0);
            pstmt.setDouble(3, reading.getTankLevel() != null ? reading.getTankLevel() : 0.0);
            pstmt.setString(4, reading.getSupplyType());
            pstmt.setBoolean(5, reading.getValveOpen() != null ? reading.getValveOpen() : false);
            pstmt.setBoolean(6, reading.getLeakDetected() != null ? reading.getLeakDetected() : false);
            pstmt.setLong(7, reading.getTimestamp() != null ? reading.getTimestamp() : System.currentTimeMillis());
            
            pstmt.executeUpdate();
            log.info("Successfully pushed data to Snowflake.");
        } catch (Exception e) {
            log.error("Failed to sink data to Snowflake: {}", e.getMessage());
            // In a hackathon, we might not want to crash the whole consumer if Snowflake is down
        }
    }
}
