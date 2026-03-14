package com.aquasmart.controller;

import com.aquasmart.model.UserAccount;
import com.aquasmart.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
}
