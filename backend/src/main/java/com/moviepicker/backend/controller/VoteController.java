package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.service.ConsensusService;
import com.moviepicker.backend.service.RoomEventPublisher;
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
    private final ConsensusService consensusService;
    private final SessionRepository sessionRepository;
    private final RoomEventPublisher roomEventPublisher;

    @PostMapping("/{sessionId}/votes")
    public ResponseEntity<VoteResponse> castVote(
            @PathVariable Long sessionId,
            @Valid @RequestBody CastVoteRequest request) {
        VoteResponse response = voteService.castVote(sessionId, request);

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));
        VotingProgressResponse progress = voteService.getVotingProgress(sessionId);

        RoomEventType eventType = RoomEventType.VOTE_CAST;
        if (progress.isAllUsersCompleted()) {
            eventType = RoomEventType.ALL_VOTING_COMPLETED;
        } else {
            boolean userCompleted = progress.getUsers().stream()
                    .filter(u -> u.getUserId().equals(request.getUserId()))
                    .anyMatch(UserVotingProgressDto::isCompleted);
            if (userCompleted) {
                eventType = RoomEventType.USER_COMPLETED;
            }
        }

        RoomProgressEvent event = RoomProgressEvent.builder()
                .eventType(eventType)
                .roomCode(session.getRoomCode())
                .userId(response.getUserId())
                .userDisplayName(response.getUserDisplayName())
                .movieSuggestionId(response.getMovieSuggestionId())
                .tmdbId(response.getTmdbId())
                .movieTitle(response.getMovieTitle())
                .voteType(response.getVoteType())
                .progress(progress)
                .build();

        roomEventPublisher.publishVoteProgress(session.getRoomCode(), event);

        if (progress.isAllUsersCompleted()) {
            SessionResultsResponse results = consensusService.calculateResults(session.getId());
            roomEventPublisher.publishResults(session.getRoomCode(), results);
        }

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
