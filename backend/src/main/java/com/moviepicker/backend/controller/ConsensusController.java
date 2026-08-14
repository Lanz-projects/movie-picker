package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.service.ConsensusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class ConsensusController {

    private final ConsensusService consensusService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/{sessionId}/calculate")
    public ResponseEntity<SessionResultsResponse> calculateResults(@PathVariable Long sessionId) {
        SessionResultsResponse response = consensusService.calculateResults(sessionId);
        broadcastResults(response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/room/{roomCode}/calculate")
    public ResponseEntity<SessionResultsResponse> calculateResultsByRoomCode(@PathVariable String roomCode) {
        SessionResultsResponse response = consensusService.calculateResultsByRoomCode(roomCode);
        broadcastResults(response);
        return ResponseEntity.ok(response);
    }

    private void broadcastResults(SessionResultsResponse response) {
        if (response != null && response.getRoomCode() != null) {
            String destination = "/topic/room/" + response.getRoomCode().trim() + "/results";
            messagingTemplate.convertAndSend(destination, response);
            log.info("Broadcasted consensus results to destination='{}'", destination);
        }
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
