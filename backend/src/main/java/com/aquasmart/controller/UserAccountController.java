package com.aquasmart.controller;

import com.aquasmart.model.UserAccount;
import com.aquasmart.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/user")
@CrossOrigin(origins = "*")
public class UserAccountController {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @GetMapping("/account/{deviceId}")
    public ResponseEntity<UserAccount> getAccount(@PathVariable String deviceId) {
        return userAccountRepository.findByDeviceId(deviceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/topup")
    public ResponseEntity<UserAccount> topUp(@RequestParam String deviceId, @RequestParam BigDecimal amount) {
        Optional<UserAccount> accountOpt = userAccountRepository.findByDeviceId(deviceId);

        UserAccount account;
        if (accountOpt.isPresent()) {
            account = accountOpt.get();
        } else {
            // Auto-create for demo purposes if it doesn't exist
            account = UserAccount.builder()
                    .deviceId(deviceId)
                    .ownerName("Home User (" + deviceId + ")")
                    .premiseId("AUTO-" + deviceId.toUpperCase())
                    .balance(BigDecimal.ZERO)
                    .emergencyCreditLimit(new BigDecimal("50.00")) // $50 JMD grace period
                    .valveDisabledByBalance(false)
                    .build();
        }

        account.topUp(amount);
        return ResponseEntity.ok(userAccountRepository.save(account));
    }

    @PostMapping("/target")
    public ResponseEntity<UserAccount> setTarget(@RequestParam String deviceId, @RequestParam BigDecimal amount) {
        return userAccountRepository.findByDeviceId(deviceId)
                .map(account -> {
                    account.setTargetAmount(amount);
                    // Reset usage if target is updated? For hackathon demo, yes.
                    account.setCumulativeUsage(BigDecimal.ZERO);
                    return ResponseEntity.ok(userAccountRepository.save(account));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/crop")
    public ResponseEntity<UserAccount> setCrop(@RequestParam String deviceId, @RequestParam String cropType) {
        return userAccountRepository.findByDeviceId(deviceId)
                .map(account -> {
                    String normCrop = cropType.toUpperCase().trim();
                    account.setCropType(normCrop);
                    
                    // Automatically update target based on crop requirements
                    BigDecimal target = UserAccount.CROP_REQUIREMENTS.getOrDefault(normCrop, BigDecimal.ZERO);
                    account.setTargetAmount(target);
                    
                    // Reset usage when crop changes for the demo loop
                    account.setCumulativeUsage(BigDecimal.ZERO);
                    
                    return ResponseEntity.ok(userAccountRepository.save(account));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/link")
    public ResponseEntity<UserAccount> linkDevice(@RequestBody Map<String, String> body) {
        String deviceId = body.get("deviceId");
        String premiseId = body.get("premiseId");
        String ownerName = body.get("ownerName");
        String cropType = body.get("cropType");

        if (deviceId == null) {
            return ResponseEntity.badRequest().build();
        }

        UserAccount account = userAccountRepository.findByDeviceId(deviceId)
                .map(existing -> {
                    if (premiseId != null) existing.setPremiseId(premiseId);
                    if (ownerName != null) existing.setOwnerName(ownerName);
                    if (cropType != null) existing.setCropType(cropType);
                    return userAccountRepository.save(existing);
                })
                .orElseGet(() -> {
                    return userAccountRepository.save(UserAccount.builder()
                            .deviceId(deviceId)
                            .premiseId(premiseId != null ? premiseId : "AUTO-" + deviceId.toUpperCase())
                            .ownerName(ownerName != null ? ownerName : "New User")
                            .cropType(cropType != null ? cropType : "NONE")
                            .balance(new BigDecimal("250.00"))
                            .emergencyCreditLimit(new BigDecimal("50.00"))
                            .targetAmount(new BigDecimal("5.00"))
                            .build());
                });

        return ResponseEntity.ok(account);
    }
}
