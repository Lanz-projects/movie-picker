package com.moviepicker.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieSubmissionDto {

    @NotNull(message = "TMDB ID is required")
    private Long tmdbId;

    @NotBlank(message = "Movie title must not be blank")
    private String title;

    private String overview;

    private String posterPath;

    private Integer releaseYear;
}
