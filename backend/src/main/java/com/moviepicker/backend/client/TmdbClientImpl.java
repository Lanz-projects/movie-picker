package com.moviepicker.backend.client;

import com.moviepicker.backend.config.TmdbProperties;
import com.moviepicker.backend.dto.tmdb.TmdbMovieDetailsResponse;
import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;
import com.moviepicker.backend.exception.TmdbApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriBuilder;

import java.util.function.Supplier;

@Slf4j
@Component
public class TmdbClientImpl implements TmdbClient {

    private final RestClient restClient;
    private final TmdbProperties properties;

    @Autowired
    public TmdbClientImpl(RestClient.Builder restClientBuilder, TmdbProperties properties) {
        this.properties = properties;

        RestClient.Builder builder = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                    String errorBody = new String(response.getBody().readAllBytes());
                    log.error("TMDB API returned error status: {} - {}", response.getStatusCode(), errorBody);
                    throw new TmdbApiException("TMDB API returned status " + response.getStatusCode() + ": " + errorBody);
                });

        if (StringUtils.hasText(properties.getAccessToken())) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getAccessToken().trim());
        }

        this.restClient = builder.build();
    }

    public TmdbClientImpl(RestClient restClient, TmdbProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public TmdbSearchResponse searchMovies(String query, int page) {
        if (!StringUtils.hasText(query)) {
            return TmdbSearchResponse.builder().page(page).build();
        }

        return executeWithRetry(() -> restClient.get()
                .uri(builder -> applyAuthParams(builder.path("/search/movie")
                        .queryParam("query", query)
                        .queryParam("page", Math.max(1, page))
                        .queryParam("include_adult", false))
                        .build())
                .retrieve()
                .body(TmdbSearchResponse.class), "searchMovies");
    }

    @Override
    public TmdbMovieDetailsResponse getMovieDetails(Long tmdbId) {
        if (tmdbId == null) {
            return null;
        }

        return executeWithRetry(() -> restClient.get()
                .uri(builder -> applyAuthParams(builder.path("/movie/{id}")
                        .queryParam("append_to_response", "credits,watch/providers,release_dates"))
                        .build(tmdbId))
                .retrieve()
                .body(TmdbMovieDetailsResponse.class), "getMovieDetails");
    }

    @Override
    public TmdbSearchResponse getTrendingMovies(int page) {
        return executeWithRetry(() -> restClient.get()
                .uri(builder -> applyAuthParams(builder.path("/trending/movie/week")
                        .queryParam("page", Math.max(1, page))
                        .queryParam("language", "en-US"))
                        .build())
                .retrieve()
                .body(TmdbSearchResponse.class), "getTrendingMovies");
    }

    @Override
    public TmdbSearchResponse discoverMovies(
            Integer genreId,
            Integer providerId,
            String releaseDateGte,
            String releaseDateLte,
            Double minRating,
            Integer minRuntime,
            Integer maxRuntime,
            String language,
            String sortBy,
            int page) {

        return executeWithRetry(() -> restClient.get()
                .uri(builder -> {
                    builder.path("/discover/movie")
                            .queryParam("page", Math.max(1, page))
                            .queryParam("include_adult", false)
                            .queryParam("language", "en-US")
                            .queryParam("sort_by", StringUtils.hasText(sortBy) ? sortBy : "popularity.desc");

                    if (genreId != null) builder.queryParam("with_genres", genreId);
                    if (providerId != null) {
                        builder.queryParam("with_watch_providers", providerId);
                        builder.queryParam("watch_region", "US");
                    }
                    if (StringUtils.hasText(releaseDateGte)) builder.queryParam("primary_release_date.gte", releaseDateGte);
                    if (StringUtils.hasText(releaseDateLte)) builder.queryParam("primary_release_date.lte", releaseDateLte);
                    if (minRating != null && minRating > 0) {
                        builder.queryParam("vote_average.gte", minRating);
                        builder.queryParam("vote_count.gte", 50);
                    }
                    if (minRuntime != null && minRuntime > 0) builder.queryParam("with_runtime.gte", minRuntime);
                    if (maxRuntime != null && maxRuntime > 0) builder.queryParam("with_runtime.lte", maxRuntime);
                    if (StringUtils.hasText(language)) builder.queryParam("with_original_language", language);

                    return applyAuthParams(builder).build();
                })
                .retrieve()
                .body(TmdbSearchResponse.class), "discoverMovies");
    }

    private UriBuilder applyAuthParams(UriBuilder uriBuilder) {
        if (!StringUtils.hasText(properties.getAccessToken()) && StringUtils.hasText(properties.getKey())) {
            uriBuilder.queryParam("api_key", properties.getKey());
        }
        return uriBuilder;
    }

    private <T> T executeWithRetry(Supplier<T> requestSupplier, String operationName) {
        int maxRetries = Math.max(0, properties.getMaxRetries());
        long backoffMs = Math.max(50, properties.getRetryBackoffMs());

        int attempt = 0;
        while (true) {
            try {
                return requestSupplier.get();
            } catch (TmdbApiException e) {
                boolean isRetriable = e.getMessage() != null &&
                        (e.getMessage().contains("429") || e.getMessage().contains("500") ||
                         e.getMessage().contains("502") || e.getMessage().contains("503") || e.getMessage().contains("504"));

                if (isRetriable && attempt < maxRetries) {
                    attempt++;
                    long delay = backoffMs * (1L << (attempt - 1));
                    log.warn("TMDB API transient failure on {} (attempt {}/{}). Retrying in {}ms: {}",
                            operationName, attempt, maxRetries, delay, e.getMessage());
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                    continue;
                }
                throw e;
            } catch (RestClientException e) {
                if (attempt < maxRetries) {
                    attempt++;
                    long delay = backoffMs * (1L << (attempt - 1));
                    log.warn("TMDB connection error on {} (attempt {}/{}). Retrying in {}ms: {}",
                            operationName, attempt, maxRetries, delay, e.getMessage());
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new TmdbApiException("Failed to communicate with TMDB API: " + e.getMessage(), e);
                    }
                    continue;
                }
                log.error("Error communicating with TMDB API on {}: {}", operationName, e.getMessage(), e);
                throw new TmdbApiException("Failed to communicate with TMDB API: " + e.getMessage(), e);
            }
        }
    }
}
