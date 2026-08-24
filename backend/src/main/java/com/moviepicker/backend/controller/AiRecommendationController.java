package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.ai.AiRecommendationRequest;
import com.moviepicker.backend.dto.ai.AiRecommendationResponse;
import com.moviepicker.backend.security.auth.SessionSecurityService;
import com.moviepicker.backend.service.AiRecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;
    private final SessionSecurityService sessionSecurityService;

    @PostMapping({"/api/v1/sessions/{roomCode}/ai/recommendations", "/api/sessions/{roomCode}/ai/recommendations"})
    public ResponseEntity<AiRecommendationResponse> getRoomRecommendations(
            @PathVariable String roomCode,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            @Valid @RequestBody AiRecommendationRequest request) {

        if (StringUtils.hasText(sessionToken)) {
            sessionSecurityService.validateUserToken(roomCode, null, sessionToken);
        }

        AiRecommendationResponse response = aiRecommendationService.getRecommendations(roomCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/api/v1/ai/recommendations", "/api/ai/recommendations"})
    public ResponseEntity<AiRecommendationResponse> getStandaloneRecommendations(
            @Valid @RequestBody AiRecommendationRequest request) {

        AiRecommendationResponse response = aiRecommendationService.getRecommendations(request);
        return ResponseEntity.ok(response);
    }
}
