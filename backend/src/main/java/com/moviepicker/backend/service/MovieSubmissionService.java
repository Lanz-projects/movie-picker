package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.MovieSuggestionResponse;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.SubmitMoviesRequest;

import java.util.List;

public interface MovieSubmissionService {
    List<MovieSuggestionResponse> submitMovies(Long sessionId, SubmitMoviesRequest request);
    List<MovieSuggestionResponse> getSessionMovies(Long sessionId);
    SessionResponse startVoting(Long sessionId);
}
