package com.moviepicker.backend.security.ratelimit;

/**
 * Categories of endpoints with distinct rate limit quotas.
 */
public enum EndpointCategory {
    CREATE_SESSION,
    JOIN_SESSION,
    MOVIE_SEARCH,
    SESSION_ACTION,
    DEFAULT
}
