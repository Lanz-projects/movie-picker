package com.moviepicker.backend.client;

import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;

public interface TmdbClient {
    TmdbSearchResponse searchMovies(String query, int page);
}
