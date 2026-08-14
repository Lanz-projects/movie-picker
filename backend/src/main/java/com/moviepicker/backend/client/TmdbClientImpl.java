package com.moviepicker.backend.client;

import com.moviepicker.backend.config.TmdbProperties;
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

@Slf4j
@Component
public class TmdbClientImpl implements TmdbClient {

    private final RestClient restClient;
    private final TmdbProperties properties;

    @Autowired
    public TmdbClientImpl(RestClient.Builder restClientBuilder, TmdbProperties properties) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // Constructor for testing with pre-built RestClient
    public TmdbClientImpl(RestClient restClient, TmdbProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public TmdbSearchResponse searchMovies(String query, int page) {
        if (!StringUtils.hasText(query)) {
            return TmdbSearchResponse.builder().page(page).build();
        }

        try {
            return restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/search/movie")
                                .queryParam("query", query)
                                .queryParam("page", Math.max(1, page))
                                .queryParam("include_adult", false);

                        if (!StringUtils.hasText(properties.getAccessToken()) && StringUtils.hasText(properties.getKey())) {
                            uriBuilder.queryParam("api_key", properties.getKey());
                        }
                        return uriBuilder.build();
                    })
                    .headers(headers -> {
                        if (StringUtils.hasText(properties.getAccessToken())) {
                            headers.setBearerAuth(properties.getAccessToken());
                        }
                    })
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (request, response) -> {
                        String errorBody = new String(response.getBody().readAllBytes());
                        log.error("TMDB API returned error status: {} - {}", response.getStatusCode(), errorBody);
                        throw new TmdbApiException("TMDB API returned status " + response.getStatusCode() + ": " + errorBody);
                    })
                    .body(TmdbSearchResponse.class);
        } catch (RestClientException e) {
            log.error("Error communicating with TMDB API: {}", e.getMessage(), e);
            throw new TmdbApiException("Failed to communicate with TMDB API: " + e.getMessage(), e);
        }
    }
}
