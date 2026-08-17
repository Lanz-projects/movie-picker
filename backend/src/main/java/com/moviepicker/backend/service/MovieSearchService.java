package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.MovieDetailsDto;
import com.moviepicker.backend.dto.MovieSearchResponse;

public interface MovieSearchService {
    MovieSearchResponse searchMovies(String query, int page);
    MovieDetailsDto getMovieDetails(Long tmdbId);
}
