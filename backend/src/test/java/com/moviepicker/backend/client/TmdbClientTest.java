package com.moviepicker.backend.client;

import com.moviepicker.backend.config.TmdbProperties;
import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;
import com.moviepicker.backend.exception.TmdbApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

public class TmdbClientTest {

    private TmdbClientImpl tmdbClient;
    private MockRestServiceServer mockServer;
    private TmdbProperties properties;

    @BeforeEach
    public void setUp() {
        properties = new TmdbProperties();
        properties.setBaseUrl("https://api.themoviedb.org/3");
        properties.setAccessToken("test_access_token");

        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        tmdbClient = new TmdbClientImpl(builder, properties);
    }

    @Test
    public void testSearchMovies_Success() {
        String jsonResponse = """
                {
                    "page": 1,
                    "results": [
                        {
                            "id": 550,
                            "title": "Fight Club",
                            "overview": "An insomniac...",
                            "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
                            "release_date": "1999-10-15",
                            "vote_average": 8.4
                        }
                    ],
                    "total_pages": 1,
                    "total_results": 1
                }
                """;

        mockServer.expect(requestTo("https://api.themoviedb.org/3/search/movie?query=Fight%20Club&page=1&include_adult=false"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer test_access_token"))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TmdbSearchResponse response = tmdbClient.searchMovies("Fight Club", 1);

        assertThat(response).isNotNull();
        assertThat(response.getPage()).isEqualTo(1);
        assertThat(response.getTotalResults()).isEqualTo(1);
        assertThat(response.getResults()).hasSize(1);
        assertThat(response.getResults().get(0).getTitle()).isEqualTo("Fight Club");
        assertThat(response.getResults().get(0).getId()).isEqualTo(550L);

        mockServer.verify();
    }

    @Test
    public void testSearchMovies_FallbackToApiKeyWhenNoAccessToken() {
        properties.setAccessToken("");
        properties.setKey("test_api_key");

        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        tmdbClient = new TmdbClientImpl(builder, properties);

        String jsonResponse = """
                {
                    "page": 1,
                    "results": [],
                    "total_pages": 0,
                    "total_results": 0
                }
                """;

        mockServer.expect(requestTo("https://api.themoviedb.org/3/search/movie?query=Avatar&page=1&include_adult=false&api_key=test_api_key"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TmdbSearchResponse response = tmdbClient.searchMovies("Avatar", 1);

        assertThat(response).isNotNull();
        mockServer.verify();
    }

    @Test
    public void testSearchMovies_EmptyQueryReturnsEmptyResponse() {
        TmdbSearchResponse response = tmdbClient.searchMovies("", 1);
        assertThat(response).isNotNull();
        assertThat(response.getResults()).isEmpty();
    }

    @Test
    public void testGetTrendingMovies_Success() {
        String jsonResponse = """
                {
                    "page": 1,
                    "results": [
                        {
                            "id": 101,
                            "title": "Inception",
                            "overview": "A thief...",
                            "release_date": "2010-07-16",
                            "vote_average": 8.3
                        }
                    ],
                    "total_pages": 1,
                    "total_results": 1
                }
                """;

        mockServer.expect(requestTo("https://api.themoviedb.org/3/trending/movie/week?page=1&language=en-US"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer test_access_token"))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TmdbSearchResponse response = tmdbClient.getTrendingMovies(1);

        assertThat(response).isNotNull();
        assertThat(response.getResults()).hasSize(1);
        assertThat(response.getResults().get(0).getTitle()).isEqualTo("Inception");

        mockServer.verify();
    }

    @Test
    public void testDiscoverMovies_Success() {
        String jsonResponse = """
                {
                    "page": 1,
                    "results": [
                        {
                            "id": 202,
                            "title": "The Dark Knight",
                            "overview": "Batman...",
                            "release_date": "2008-07-18",
                            "vote_average": 9.0
                        }
                    ],
                    "total_pages": 1,
                    "total_results": 1
                }
                """;

        mockServer.expect(requestTo("https://api.themoviedb.org/3/discover/movie?page=1&include_adult=false&language=en-US&sort_by=popularity.desc&with_genres=28&with_watch_providers=8&watch_region=US"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer test_access_token"))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        TmdbSearchResponse response = tmdbClient.discoverMovies(28, 8, "popularity.desc", 1);

        assertThat(response).isNotNull();
        assertThat(response.getResults()).hasSize(1);
        assertThat(response.getResults().get(0).getTitle()).isEqualTo("The Dark Knight");

        mockServer.verify();
    }

    @Test
    public void testSearchMovies_ApiErrorThrowsTmdbApiException() {
        mockServer.expect(requestTo("https://api.themoviedb.org/3/search/movie?query=Error&page=1&include_adult=false"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"status_message\":\"Invalid API key\"}"));

        assertThatThrownBy(() -> tmdbClient.searchMovies("Error", 1))
                .isInstanceOf(TmdbApiException.class)
                .hasMessageContaining("401");

        mockServer.verify();
    }
}
