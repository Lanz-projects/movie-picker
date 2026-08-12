package com.moviepicker.backend.exception;

public class DuplicateDisplayNameException extends RuntimeException {
    public DuplicateDisplayNameException(String message) {
        super(message);
    }
}
