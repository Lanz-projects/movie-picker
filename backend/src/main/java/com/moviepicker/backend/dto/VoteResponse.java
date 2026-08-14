package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.Vote;
import com.moviepicker.backend.model.VoteType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteResponse {

    private Long id;
    private Long sessionId;
    private Long userId;
    private String userDisplayName;
    private Long movieSuggestionId;
    private Long tmdbId;
    private String movieTitle;
    private VoteType voteType;
    private LocalDateTime votedAt;

    public static VoteResponse fromEntity(Vote vote) {
        return VoteResponse.builder()
                .id(vote.getId())
                .sessionId(vote.getSession() != null ? vote.getSession().getId() : null)
                .userId(vote.getUser() != null ? vote.getUser().getId() : null)
                .userDisplayName(vote.getUser() != null ? vote.getUser().getDisplayName() : null)
                .movieSuggestionId(vote.getMovieSuggestion() != null ? vote.getMovieSuggestion().getId() : null)
                .tmdbId(vote.getMovieSuggestion() != null ? vote.getMovieSuggestion().getTmdbId() : null)
                .movieTitle(vote.getMovieSuggestion() != null ? vote.getMovieSuggestion().getTitle() : null)
                .voteType(vote.getVoteType())
                .votedAt(vote.getVotedAt())
                .build();
    }
}
