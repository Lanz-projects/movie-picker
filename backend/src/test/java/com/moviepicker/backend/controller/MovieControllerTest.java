package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.MovieDto;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.exception.GlobalExceptionHandler;
import com.moviepicker.backend.exception.TmdbApiException;
import com.moviepicker.backend.service.MovieSearchService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MovieController.class)
@Import(GlobalExceptionHandler.class)
public class MovieControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MovieSearchService movieSearchService;

    @Test
    public void testSearchMovies_Success() throws Exception {
        MovieDto movie = MovieDto.builder()
                .tmdbId(550L)
                .title("Fight Club")
                .overview("An insomniac office worker...")
                .posterPath("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg")
                .releaseYear(1999)
                .voteAverage(8.4)
                .build();

        MovieSearchResponse response = MovieSearchResponse.builder()
                .page(1)
                .totalPages(3)
                .totalResults(60)
                .movies(List.of(movie))
                .build();

        when(movieSearchService.searchMovies(eq("Fight Club"), eq(1))).thenReturn(response);

        mockMvc.perform(get("/api/movies/search")
                        .param("query", "Fight Club")
                        .param("page", "1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.totalResults").value(60))
                .andExpect(jsonPath("$.movies[0].tmdbId").value(550))
                .andExpect(jsonPath("$.movies[0].title").value("Fight Club"))
                .andExpect(jsonPath("$.movies[0].releaseYear").value(1999));
    }

    @Test
    public void testSearchMovies_BlankQueryReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/movies/search")
                        .param("query", "   ")
                        .param("page", "1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testSearchMovies_InvalidPageReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/movies/search")
                        .param("query", "Fight Club")
                        .param("page", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testSearchMovies_TmdbErrorReturnsBadGateway() throws Exception {
        when(movieSearchService.searchMovies(eq("ErrorMovie"), eq(1)))
                .thenThrow(new TmdbApiException("TMDB API 500 error"));

        mockMvc.perform(get("/api/movies/search")
                        .param("query", "ErrorMovie")
                        .param("page", "1"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value("TMDB API 500 error"));
    }
}
