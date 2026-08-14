package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VotingProgressResponse {

    private Long sessionId;
    private String roomCode;
    private int totalMovies;
    private int totalUsers;
    private int completedUserCount;
    private boolean allUsersCompleted;
    @Builder.Default
    private List<UserVotingProgressDto> users = new ArrayList<>();
}
