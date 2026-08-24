package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDetailsDto implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long tmdbId;
    private String title;
    private String tagline;
    private String overview;
    private String posterPath;
    private String backdropPath;
    private Integer releaseYear;
    private String releaseDate;
    private Integer runtime; // In minutes
    private String formattedRuntime; // e.g. "2h 28m"
    private String contentRating; // e.g. "PG-13", "R"
    private Double voteAverage;
    private Integer voteCount;
    private Double popularity;
    private String originalLanguage;
    private List<String> genres;
    private List<String> directors;
    private List<String> topCast;
    private List<StreamingProviderDto> streamingProviders;
    private String tmdbUrl;
}
