package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.CastVoteRequest;
import com.moviepicker.backend.dto.VoteResponse;
import com.moviepicker.backend.dto.VotingProgressResponse;
import com.moviepicker.backend.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    @PostMapping("/{sessionId}/votes")
    public ResponseEntity<VoteResponse> castVote(
            @PathVariable Long sessionId,
            @Valid @RequestBody CastVoteRequest request) {
        VoteResponse response = voteService.castVote(sessionId, request);
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
