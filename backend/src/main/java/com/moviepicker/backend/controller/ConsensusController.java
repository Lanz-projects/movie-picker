package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.service.ConsensusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class ConsensusController {

    private final ConsensusService consensusService;

    @PostMapping("/{sessionId}/calculate")
    public ResponseEntity<SessionResultsResponse> calculateResults(@PathVariable Long sessionId) {
        SessionResultsResponse response = consensusService.calculateResults(sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/room/{roomCode}/calculate")
    public ResponseEntity<SessionResultsResponse> calculateResultsByRoomCode(@PathVariable String roomCode) {
        SessionResultsResponse response = consensusService.calculateResultsByRoomCode(roomCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}/results")
    public ResponseEntity<SessionResultsResponse> getResults(@PathVariable Long sessionId) {
        SessionResultsResponse response = consensusService.getResults(sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/room/{roomCode}/results")
    public ResponseEntity<SessionResultsResponse> getResultsByRoomCode(@PathVariable String roomCode) {
        SessionResultsResponse response = consensusService.getResultsByRoomCode(roomCode);
        return ResponseEntity.ok(response);
    }
}
