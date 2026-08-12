package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.CreateSessionRequest;
import com.moviepicker.backend.dto.JoinSessionRequest;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.UpdateSessionStatusRequest;
import com.moviepicker.backend.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

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
            @Valid @RequestBody UpdateSessionStatusRequest request) {
        SessionResponse response = sessionService.updateSessionStatus(roomCode, request);
        return ResponseEntity.ok(response);
    }
}
