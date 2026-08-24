package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.CastVoteRequest;
import com.moviepicker.backend.dto.VoteMessageDto;
import com.moviepicker.backend.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class VoteMessageController {

    private final VoteService voteService;

    @MessageMapping("/vote")
    public void handleVote(@Valid @Payload VoteMessageDto message) {
        log.info("Received WebSocket vote message for roomCode='{}', user={}, movie={}",
                message.getRoomCode(), message.getUserId(), message.getMovieSuggestionId());

        CastVoteRequest castRequest = CastVoteRequest.builder()
                .userId(message.getUserId())
                .movieSuggestionId(message.getMovieSuggestionId())
                .voteType(message.getVoteType())
                .build();

        voteService.castVoteAndBroadcastByRoomCode(message.getRoomCode().trim(), castRequest);
    }
}
