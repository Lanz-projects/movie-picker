package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.service.MovieSearchService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
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
}
