package com.moviepicker.backend.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class TmdbSearchResponse {

    @Builder.Default
    private Integer page = 1;

    @Builder.Default
    private List<TmdbMovieDto> results = new ArrayList<>();

    @JsonProperty("total_pages")
    @Builder.Default
    private Integer totalPages = 1;

    @JsonProperty("total_results")
    @Builder.Default
    private Integer totalResults = 0;
}
