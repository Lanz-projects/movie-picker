package com.moviepicker.backend.service;

import com.moviepicker.backend.client.TmdbClient;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.dto.tmdb.TmdbMovieDto;
import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class MovieSearchCacheTest {

    @MockitoBean
    private TmdbClient tmdbClient;

    @Autowired
    private MovieSearchService movieSearchService;

    @Test
    public void testCacheableBehavior() {
        TmdbMovieDto movie = TmdbMovieDto.builder()
                .id(550L)
                .title("Fight Club")
                .releaseDate("1999-10-15")
                .build();

        TmdbSearchResponse mockResponse = TmdbSearchResponse.builder()
                .page(1)
                .totalPages(1)
                .totalResults(1)
                .results(List.of(movie))
                .build();

        when(tmdbClient.searchMovies("interstellar", 1)).thenReturn(mockResponse);

        // First call - should invoke client
        MovieSearchResponse response1 = movieSearchService.searchMovies("interstellar", 1);
        assertThat(response1.getMovies()).hasSize(1);

        // Second call with same parameters - should hit cache and NOT invoke client again
        MovieSearchResponse response2 = movieSearchService.searchMovies("interstellar", 1);
        assertThat(response2.getMovies()).hasSize(1);

        // Case insensitivity & trimming test (same cache key)
        MovieSearchResponse response3 = movieSearchService.searchMovies("  INTERSTELLAR  ", 1);
        assertThat(response3.getMovies()).hasSize(1);

        verify(tmdbClient, times(1)).searchMovies("interstellar", 1);
    }
}
