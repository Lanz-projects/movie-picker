package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.MovieDetailsDto;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.service.MovieSearchService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
@Validated
public class MovieController {

    private final MovieSearchService movieSearchService;

    @GetMapping("/search")
    public ResponseEntity<MovieSearchResponse> searchMovies(
            @RequestParam @NotBlank(message = "Query parameter must not be blank") String query,
            @RequestParam(defaultValue = "1") @Min(value = 1, message = "Page number must be at least 1") int page) {
        MovieSearchResponse response = movieSearchService.searchMovies(query, page);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{tmdbId}")
    public ResponseEntity<MovieDetailsDto> getMovieDetails(
            @PathVariable @NotNull(message = "TMDB ID must not be null") Long tmdbId) {
        MovieDetailsDto response = movieSearchService.getMovieDetails(tmdbId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
}
