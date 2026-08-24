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
public class MovieDto implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long tmdbId;
    private String title;
    private String overview;
    private String posterPath;
    private String backdropPath;
    private Integer releaseYear;
    private String releaseDate;
    private Double voteAverage;
    private Integer voteCount;
    private Double popularity;
    private String originalLanguage;
    private List<String> genres;
    private String aiReasoning;
}
