package com.aquasmart.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "user_accounts")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String deviceId;

    @Column(nullable = false)
    private String ownerName;

    @Column(nullable = false)
    private BigDecimal balance;

    @Column(nullable = false)
    private BigDecimal emergencyCreditLimit;

    @Column(nullable = false)
    private boolean valveDisabledByBalance;

    @Column(nullable = false)
    private String premiseId;

    @Column
    private String registeredEmail;

    @Column
    private String registeredPhone;

    @Column(nullable = false)
    private BigDecimal targetAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal cumulativeUsage = BigDecimal.ZERO;

    public UserAccount() {
    }

    private UserAccount(Builder b) {
        this.deviceId = b.deviceId;
        this.ownerName = b.ownerName;
        this.balance = b.balance;
        this.emergencyCreditLimit = b.emergencyCreditLimit;
        this.valveDisabledByBalance = b.valveDisabledByBalance;
        this.premiseId = b.premiseId;
        this.registeredEmail = b.registeredEmail;
        this.registeredPhone = b.registeredPhone;
        this.targetAmount = b.targetAmount;
        this.cumulativeUsage = b.cumulativeUsage;
    }

    // ---- Business methods ----
    public void deduct(BigDecimal amount) {
        this.balance = this.balance.subtract(amount);
    }

    public void trackUsage(BigDecimal liters) {
        this.cumulativeUsage = this.cumulativeUsage.add(liters);
    }

    public boolean isTargetReached() {
        return targetAmount.compareTo(BigDecimal.ZERO) > 0 && cumulativeUsage.compareTo(targetAmount) >= 0;
    }

    public void topUp(BigDecimal amount) {
        this.balance = this.balance.add(amount);
        if (this.balance.add(emergencyCreditLimit).compareTo(BigDecimal.ZERO) > 0) {
            this.valveDisabledByBalance = false;
        }
    }

    // ---- Getters ----
    public Long getId() {
        return id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public BigDecimal getEmergencyCreditLimit() {
        return emergencyCreditLimit;
    }

    public boolean isValveDisabledByBalance() {
        return valveDisabledByBalance;
    }

    public String getPremiseId() {
        return premiseId;
    }

    public String getRegisteredEmail() {
        return registeredEmail;
    }

    public String getRegisteredPhone() {
        return registeredPhone;
    }

    public BigDecimal getTargetAmount() {
        return targetAmount;
    }

    public BigDecimal getCumulativeUsage() {
        return cumulativeUsage;
    }

    // ---- Setters ----
    public void setId(Long id) {
        this.id = id;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public void setEmergencyCreditLimit(BigDecimal v) {
        this.emergencyCreditLimit = v;
    }

    public void setValveDisabledByBalance(boolean v) {
        this.valveDisabledByBalance = v;
    }

    public void setPremiseId(String premiseId) {
        this.premiseId = premiseId;
    }

    public void setRegisteredEmail(String registeredEmail) {
        this.registeredEmail = registeredEmail;
    }

    public void setRegisteredPhone(String registeredPhone) {
        this.registeredPhone = registeredPhone;
    }

    public void setTargetAmount(BigDecimal targetAmount) {
        this.targetAmount = targetAmount;
    }

    public void setCumulativeUsage(BigDecimal cumulativeUsage) {
        this.cumulativeUsage = cumulativeUsage;
    }

    // ---- Builder ----
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String deviceId, ownerName;
        private BigDecimal balance = BigDecimal.ZERO;
        private BigDecimal emergencyCreditLimit = BigDecimal.ZERO;
        private boolean valveDisabledByBalance = false;
        private String premiseId;
        private String registeredEmail;
        private String registeredPhone;
        private BigDecimal targetAmount = BigDecimal.ZERO;
        private BigDecimal cumulativeUsage = BigDecimal.ZERO;

        public Builder deviceId(String v) {
            this.deviceId = v;
            return this;
        }

        public Builder ownerName(String v) {
            this.ownerName = v;
            return this;
        }

        public Builder balance(BigDecimal v) {
            this.balance = v;
            return this;
        }

        public Builder emergencyCreditLimit(BigDecimal v) {
            this.emergencyCreditLimit = v;
            return this;
        }

        public Builder valveDisabledByBalance(boolean v) {
            this.valveDisabledByBalance = v;
            return this;
        }

        public Builder premiseId(String v) {
            this.premiseId = v;
            return this;
        }

        public Builder registeredEmail(String v) {
            this.registeredEmail = v;
            return this;
        }

        public Builder registeredPhone(String v) {
            this.registeredPhone = v;
            return this;
        }

        public Builder targetAmount(BigDecimal v) {
            this.targetAmount = v;
            return this;
        }

        public Builder cumulativeUsage(BigDecimal v) {
            this.cumulativeUsage = v;
            return this;
        }

        public UserAccount build() {
            return new UserAccount(this);
        }
    }
}
