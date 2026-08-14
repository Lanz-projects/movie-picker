package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.VoteType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomProgressEvent {

    private RoomEventType eventType;
    private String roomCode;
    private Long userId;
    private String userDisplayName;
    private Long movieSuggestionId;
    private Long tmdbId;
    private String movieTitle;
    private VoteType voteType;
    private VotingProgressResponse progress;
}
