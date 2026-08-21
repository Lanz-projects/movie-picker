package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.MovieSuggestionResponse;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.SubmitMoviesRequest;
import com.moviepicker.backend.service.MovieSubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/sessions/{sessionId}", "/api/sessions/{sessionId}"})
@RequiredArgsConstructor
public class MovieSubmissionController {

    private final MovieSubmissionService movieSubmissionService;

    @PostMapping("/movies")
    public ResponseEntity<List<MovieSuggestionResponse>> submitMovies(
            @PathVariable Long sessionId,
            @Valid @RequestBody SubmitMoviesRequest request) {
        List<MovieSuggestionResponse> response = movieSubmissionService.submitMovies(sessionId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/movies")
    public ResponseEntity<List<MovieSuggestionResponse>> getSessionMovies(@PathVariable Long sessionId) {
        List<MovieSuggestionResponse> response = movieSubmissionService.getSessionMovies(sessionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/start")
    public ResponseEntity<SessionResponse> startVoting(@PathVariable Long sessionId) {
        SessionResponse response = movieSubmissionService.startVoting(sessionId);
        return ResponseEntity.ok(response);
    }
}
