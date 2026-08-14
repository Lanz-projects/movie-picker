package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

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
    private Integer releaseYear;
    private Double voteAverage;
}
