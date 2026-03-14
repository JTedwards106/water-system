package com.aquasmart.service;

import com.aquasmart.config.JwtUtil;
import com.aquasmart.model.User;
import com.aquasmart.model.UserAccount;
import com.aquasmart.repository.UserAccountRepository;
import com.aquasmart.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public Map<String, Object> register(String name, String email, String password, String phone, String deviceId) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .phone(phone)
                .deviceId(deviceId != null && !deviceId.isBlank() ? deviceId : null)
                .build();

        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getId());
        return buildResponse(saved, token);
    }

    public Map<String, Object> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getEmail(), user.getId());
        return buildResponse(user, token);
    }

    public Map<String, Object> linkMeter(Long userId, String deviceId, String premiseId, String ownerName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserAccount account = userAccountRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("Meter number not found in official records"));

        // Validation against official record
        if (!account.getPremiseId().equalsIgnoreCase(premiseId)) {
            throw new IllegalArgumentException("Premise ID does not match our records for this meter");
        }
        if (!account.getOwnerName().equalsIgnoreCase(ownerName)) {
            throw new IllegalArgumentException("Registered owner name does not match our records");
        }

        // Link the meter to the user
        user.setDeviceId(deviceId);
        userRepository.save(user);

        return buildResponse(user, null); // Token not needed for re-auth during link
    }

    private Map<String, Object> buildResponse(User user, String token) {
        Map<String, Object> response = new java.util.HashMap<>();
        if (token != null) {
            response.put("token", token);
        }

        Map<String, Object> userData = new java.util.HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone() != null ? user.getPhone() : "");
        userData.put("deviceId", user.getDeviceId() != null ? user.getDeviceId() : "");

        response.put("user", userData);
        return response;
    }
}
