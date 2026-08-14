package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.service.ConsensusService;
import com.moviepicker.backend.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class VoteMessageController {

    private final VoteService voteService;
    private final ConsensusService consensusService;
    private final SessionRepository sessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/vote")
    public void handleVote(@Valid @Payload VoteMessageDto message) {
        log.info("Received WebSocket vote message for roomCode='{}', user={}, movie={}",
                message.getRoomCode(), message.getUserId(), message.getMovieSuggestionId());

        Session session = sessionRepository.findByRoomCode(message.getRoomCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with room code: " + message.getRoomCode()));

        CastVoteRequest castRequest = CastVoteRequest.builder()
                .userId(message.getUserId())
                .movieSuggestionId(message.getMovieSuggestionId())
                .voteType(message.getVoteType())
                .build();

        VoteResponse voteResponse = voteService.castVote(session.getId(), castRequest);
        VotingProgressResponse progress = voteService.getVotingProgress(session.getId());

        RoomEventType eventType = RoomEventType.VOTE_CAST;
        if (progress.isAllUsersCompleted()) {
            eventType = RoomEventType.ALL_VOTING_COMPLETED;
        } else {
            boolean userCompleted = progress.getUsers().stream()
                    .filter(u -> u.getUserId().equals(message.getUserId()))
                    .anyMatch(UserVotingProgressDto::isCompleted);
            if (userCompleted) {
                eventType = RoomEventType.USER_COMPLETED;
            }
        }

        RoomProgressEvent event = RoomProgressEvent.builder()
                .eventType(eventType)
                .roomCode(message.getRoomCode().trim())
                .userId(voteResponse.getUserId())
                .userDisplayName(voteResponse.getUserDisplayName())
                .movieSuggestionId(voteResponse.getMovieSuggestionId())
                .tmdbId(voteResponse.getTmdbId())
                .movieTitle(voteResponse.getMovieTitle())
                .voteType(voteResponse.getVoteType())
                .progress(progress)
                .build();

        String destination = "/topic/room/" + message.getRoomCode().trim();
        messagingTemplate.convertAndSend(destination, event);
        log.info("Broadcasted {} event to destination='{}'", eventType, destination);

        // If all users finished voting, calculate results and broadcast winner to /topic/room/{roomCode}/results
        if (progress.isAllUsersCompleted()) {
            SessionResultsResponse results = consensusService.calculateResults(session.getId());
            String resultsDestination = destination + "/results";
            messagingTemplate.convertAndSend(resultsDestination, results);
            log.info("Broadcasted winning results to destination='{}' (Winner: '{}')",
                    resultsDestination, results.getWinner() != null ? results.getWinner().getTitle() : "None");
        }
    }
}
