package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResultsResponse {

    private Long sessionId;
    private String roomCode;
    private int totalParticipants;
    private int totalMovies;
    private ScoredMovieDto winner;
    @Builder.Default
    private List<ScoredMovieDto> rankedMovies = new ArrayList<>();
    private LocalDateTime calculatedAt;
}
