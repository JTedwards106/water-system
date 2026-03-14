package com.aquasmart.controller;

import com.aquasmart.dto.UserLinkRequest;
import com.aquasmart.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@CrossOrigin(origins = "*")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/link")
    public ResponseEntity<?> linkMeter(@RequestBody(required = false) UserLinkRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Request body is missing"));
        }
        System.out.println("LINK METER REQUEST RECEIVED: " + request.getDeviceId());
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                System.out.println("LINK METER: Auth is NULL");
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Unauthorized: No authentication context found."));
            }

            Long userId = null;
            Object details = auth.getDetails();
            if (details instanceof Number) {
                userId = ((Number) details).longValue();
            }

            if (userId == null) {
                System.out.println("LINK METER: User ID not found in details: " + details);
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Unauthorized: User identity could not be verified."));
            }

            Map<String, Object> result = authService.linkMeter(
                    userId,
                    request.getDeviceId(),
                    request.getPremiseId(),
                    request.getOwnerName());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
