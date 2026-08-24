package com.moviepicker.backend.exception;

public class EmptyMoviePoolException extends RuntimeException {
    public EmptyMoviePoolException(String message) {
        super(message);
    }
}
