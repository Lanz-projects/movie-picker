package com.moviepicker.backend.exception;

public class MovieSuggestionLimitExceededException extends RuntimeException {
    public MovieSuggestionLimitExceededException(String message) {
        super(message);
    }
}
