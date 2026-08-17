package com.moviepicker.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class ScoredMovieDto {

    private Long movieSuggestionId;
    private Long tmdbId;
    private String title;
    private String posterPath;
    private String overview;
    private Integer releaseYear;
    private String suggestedBy;
    private int score;
    private long yesVotes;
    private long superlikeVotes;
    private long noVotes;
    private long skipVotes;
    private double matchPercentage;

    @JsonProperty("isUnanimous")
    private boolean isUnanimous;

    @Builder.Default
    private List<String> positiveVoters = new ArrayList<>();

    @Builder.Default
    private List<String> superlikers = new ArrayList<>();
}
