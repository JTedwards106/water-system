package com.aquasmart.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1) // Run before DataSeeder
public class SchemaPatcher implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Running Schema Patcher...");
        try {
            jdbcTemplate.execute("ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS cumulative_usage numeric(38,6) DEFAULT 0.00;");
            jdbcTemplate.execute("ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS crop_type character varying(255) DEFAULT 'NONE';");
            jdbcTemplate.execute("ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS target_amount numeric(38,2) DEFAULT 0.00;");
            System.out.println("Schema Patcher: Database columns verified/added.");
        } catch (Exception e) {
            System.err.println("Schema Patcher Warning: " + e.getMessage());
            // If it's MariaDB, the syntax might differ slightly (no 'IF NOT EXISTS' for columns in older versions)
            // But if the columns were missing, we'll see errors here or successes.
        }
    }
}
