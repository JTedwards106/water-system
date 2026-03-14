package com.aquasmart.config;

import com.aquasmart.model.UserAccount;
import com.aquasmart.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.stream.IntStream;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initDatabase(UserAccountRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                // Seed 10 official virtual meter records
                IntStream.rangeClosed(1, 10).forEach(i -> {
                    String deviceId = (i == 1) ? "home-hw-001" : "home-sim-" + String.format("%03d", i);
                    String ownerName = (i == 1) ? "Demo Hardware Owner" : "Official Owner " + i;
                    String premiseId = "PREM-" + (1000 + i);

                    UserAccount account = UserAccount.builder()
                            .deviceId(deviceId)
                            .ownerName(ownerName)
                            .premiseId(premiseId)
                            .balance(new BigDecimal("250.00")) // Initial starting balance for demo
                            .emergencyCreditLimit(new BigDecimal("50.00"))
                            .valveDisabledByBalance(false)
                            .registeredEmail("owner" + i + "@example.com")
                            .registeredPhone("876-555-000" + i)
                            .targetAmount(new BigDecimal("5.00")) // Default 5L target for demo
                            .build();

                    repository.save(account);
                });
                System.out.println("SEEDING COMPLETE: 10 Official Records Created.");
            }
        };
    }
}
