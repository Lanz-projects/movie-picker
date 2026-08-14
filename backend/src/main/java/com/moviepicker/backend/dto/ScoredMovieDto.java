package com.moviepicker.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private int score;
    private long yesVotes;
    private long superlikeVotes;
    private long noVotes;
    private long skipVotes;
    private double matchPercentage;

    @JsonProperty("isUnanimous")
    private boolean isUnanimous;
}
