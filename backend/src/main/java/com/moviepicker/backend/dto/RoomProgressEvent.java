package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.VoteType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomProgressEvent {

    private RoomEventType eventType;
    private String roomCode;
    private Long userId;
    private Long kickedUserId;
    private String userDisplayName;
    private String hostName;
    private SessionStatus sessionStatus;
    private List<UserResponse> users;
    private Integer submittedUserCount;
    private Integer totalUserCount;
    private String message;

    // Voting fields
    private Long movieSuggestionId;
    private Long tmdbId;
    private String movieTitle;
    private VoteType voteType;
    private VotingProgressResponse progress;
}

