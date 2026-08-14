package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieSearchResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private int page;
    private int totalPages;
    private int totalResults;

    @Builder.Default
    private List<MovieDto> movies = new ArrayList<>();
}
