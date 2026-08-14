package com.moviepicker.backend.service;

import com.moviepicker.backend.client.TmdbClient;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.dto.tmdb.TmdbMovieDto;
import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MovieSearchServiceTest {

    @Mock
    private TmdbClient tmdbClient;

    @InjectMocks
    private MovieSearchServiceImpl movieSearchService;

    private TmdbSearchResponse sampleTmdbResponse;

    @BeforeEach
    public void setUp() {
        TmdbMovieDto movie1 = TmdbMovieDto.builder()
                .id(550L)
                .title("Fight Club")
                .overview("A ticking-time-bomb insomniac...")
                .posterPath("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg")
                .releaseDate("1999-10-15")
                .voteAverage(8.4)
                .build();

        TmdbMovieDto movie2 = TmdbMovieDto.builder()
                .id(27205L)
                .title("Inception")
                .overview("A thief who steals corporate secrets...")
                .posterPath("/xlaY2zyzMfkhk0SuCQQB6usEjip.jpg")
                .releaseDate("2010-07-16")
                .voteAverage(8.3)
                .build();

        sampleTmdbResponse = TmdbSearchResponse.builder()
                .page(1)
                .totalPages(5)
                .totalResults(10)
                .results(List.of(movie1, movie2))
                .build();
    }

    @Test
    public void testSearchMovies_MapsCorrectly() {
        when(tmdbClient.searchMovies("Inception", 1)).thenReturn(sampleTmdbResponse);

        MovieSearchResponse response = movieSearchService.searchMovies("Inception", 1);

        assertThat(response).isNotNull();
        assertThat(response.getPage()).isEqualTo(1);
        assertThat(response.getTotalPages()).isEqualTo(5);
        assertThat(response.getTotalResults()).isEqualTo(10);
        assertThat(response.getMovies()).hasSize(2);

        assertThat(response.getMovies().get(0).getTmdbId()).isEqualTo(550L);
        assertThat(response.getMovies().get(0).getTitle()).isEqualTo("Fight Club");
        assertThat(response.getMovies().get(0).getReleaseYear()).isEqualTo(1999);

        assertThat(response.getMovies().get(1).getTmdbId()).isEqualTo(27205L);
        assertThat(response.getMovies().get(1).getTitle()).isEqualTo("Inception");
        assertThat(response.getMovies().get(1).getReleaseYear()).isEqualTo(2010);

        verify(tmdbClient, times(1)).searchMovies("Inception", 1);
    }

    @Test
    public void testSearchMovies_HandlesBlankQuery() {
        MovieSearchResponse response = movieSearchService.searchMovies("   ", 1);

        assertThat(response).isNotNull();
        assertThat(response.getMovies()).isEmpty();
        verifyNoInteractions(tmdbClient);
    }

    @Test
    public void testSearchMovies_HandlesInvalidReleaseDateFormat() {
        TmdbMovieDto invalidDateMovie = TmdbMovieDto.builder()
                .id(123L)
                .title("Unknown Date Movie")
                .releaseDate("invalid")
                .build();

        TmdbSearchResponse responseWithInvalidDate = TmdbSearchResponse.builder()
                .page(1)
                .results(List.of(invalidDateMovie))
                .build();

        when(tmdbClient.searchMovies("Unknown", 1)).thenReturn(responseWithInvalidDate);

        MovieSearchResponse response = movieSearchService.searchMovies("Unknown", 1);

        assertThat(response.getMovies()).hasSize(1);
        assertThat(response.getMovies().get(0).getReleaseYear()).isNull();
    }
}
