package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.CastVoteRequest;
import com.moviepicker.backend.dto.VoteResponse;
import com.moviepicker.backend.dto.VotingProgressResponse;
import com.moviepicker.backend.security.auth.SessionSecurityService;
import com.moviepicker.backend.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/sessions", "/api/sessions"})
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;
    private final SessionSecurityService sessionSecurityService;

    @PostMapping("/{sessionId}/votes")
    public ResponseEntity<VoteResponse> castVote(
            @PathVariable Long sessionId,
            @RequestHeader(value = "X-Session-Token", required = false) String sessionToken,
            @Valid @RequestBody CastVoteRequest request) {
        if (StringUtils.hasText(sessionToken)) {
            sessionSecurityService.validateUserTokenBySessionId(sessionId, request.getUserId(), sessionToken);
        }
        VoteResponse response = voteService.castVoteAndBroadcast(sessionId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{sessionId}/votes/progress")
    public ResponseEntity<VotingProgressResponse> getVotingProgress(@PathVariable Long sessionId) {
        VotingProgressResponse response = voteService.getVotingProgress(sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/room/{roomCode}/votes/progress")
    public ResponseEntity<VotingProgressResponse> getVotingProgressByRoomCode(@PathVariable String roomCode) {
        VotingProgressResponse response = voteService.getVotingProgressByRoomCode(roomCode);
        return ResponseEntity.ok(response);
    }
}
