package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieSuggestionResponse {

    private Long id;
    private Long tmdbId;
    private Long userId;
    private String userDisplayName;
    private String title;
    private String overview;
    private String posterPath;
    private Integer releaseYear;
    private LocalDateTime suggestedAt;
}
