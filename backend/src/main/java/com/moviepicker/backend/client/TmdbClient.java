package com.moviepicker.backend.client;

import com.moviepicker.backend.dto.tmdb.TmdbMovieDetailsResponse;
import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;

public interface TmdbClient {
    TmdbSearchResponse searchMovies(String query, int page);
    TmdbMovieDetailsResponse getMovieDetails(Long tmdbId);
    TmdbSearchResponse getTrendingMovies(int page);
    TmdbSearchResponse discoverMovies(Integer genreId, Integer providerId, String sortBy, int page);
}
