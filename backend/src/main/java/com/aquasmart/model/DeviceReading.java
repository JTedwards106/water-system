package com.aquasmart.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "device_readings")
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeviceReading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String deviceId;

    private Double flowRate;
    private Integer tankLevel;
    private Boolean valveOpen;
    private Boolean leakDetected;
    private String supplyType; // "TANK" or "MAIN"
    private Long timestamp;

    public DeviceReading() {
    }

    @PrePersist
    protected void onCreate() {
        // Force server-side timestamp for accuracy, ignoring device simulation time
        this.timestamp = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Double getFlowRate() {
        return flowRate;
    }

    public void setFlowRate(Double flowRate) {
        this.flowRate = flowRate;
    }

    public Integer getTankLevel() {
        return tankLevel;
    }

    public void setTankLevel(Integer tankLevel) {
        this.tankLevel = tankLevel;
    }

    public Boolean getValveOpen() {
        return valveOpen;
    }

    public void setValveOpen(Boolean valveOpen) {
        this.valveOpen = valveOpen;
    }

    public Boolean getLeakDetected() {
        return leakDetected;
    }

    public void setLeakDetected(Boolean leakDetected) {
        this.leakDetected = leakDetected;
    }

    public String getSupplyType() {
        return supplyType;
    }

    public void setSupplyType(String supplyType) {
        this.supplyType = supplyType;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
