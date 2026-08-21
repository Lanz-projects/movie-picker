package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.security.auth.SessionSecurityService;
import com.moviepicker.backend.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/sessions", "/api/sessions"})
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final SessionSecurityService sessionSecurityService;

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        SessionResponse response = sessionService.createSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{roomCode}")
    public ResponseEntity<SessionResponse> getSessionByRoomCode(@PathVariable String roomCode) {
        SessionResponse response = sessionService.getSessionByRoomCode(roomCode);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    public ResponseEntity<SessionResponse> joinSession(@Valid @RequestBody JoinSessionRequest request) {
        SessionResponse response = sessionService.joinSession(request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{roomCode}/status")
    public ResponseEntity<SessionResponse> updateSessionStatus(
            @PathVariable String roomCode,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            @Valid @RequestBody UpdateSessionStatusRequest request) {
        if (StringUtils.hasText(sessionToken)) {
            sessionSecurityService.validateHostToken(roomCode, sessionToken);
        }
        SessionResponse response = sessionService.updateSessionStatus(roomCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sessionId}/leave")
    public ResponseEntity<LeaveSessionResponse> leaveSession(
            @PathVariable Long sessionId,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            @Valid @RequestBody LeaveSessionRequest request) {
        if (StringUtils.hasText(sessionToken)) {
            sessionSecurityService.validateUserTokenBySessionId(sessionId, request.getUserId(), sessionToken);
        }
        LeaveSessionResponse response = sessionService.leaveSession(sessionId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/room/{roomCode}/leave")
    public ResponseEntity<LeaveSessionResponse> leaveSessionByRoomCode(
            @PathVariable String roomCode,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            @Valid @RequestBody LeaveSessionRequest request) {
        if (StringUtils.hasText(sessionToken)) {
            sessionSecurityService.validateUserToken(roomCode, request.getUserId(), sessionToken);
        }
        LeaveSessionResponse response = sessionService.leaveSessionByRoomCode(roomCode, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/room/{roomCode}/kick")
    public ResponseEntity<LeaveSessionResponse> kickUser(
            @PathVariable String roomCode,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            @Valid @RequestBody KickUserRequest request) {
        if (StringUtils.hasText(sessionToken)) {
            sessionSecurityService.validateHostToken(roomCode, sessionToken);
        }
        LeaveSessionResponse response = sessionService.kickUser(roomCode, request);
        return ResponseEntity.ok(response);
    }
}
