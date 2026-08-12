package com.moviepicker.backend.exception;

import com.moviepicker.backend.dto.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

public class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockHttpServletRequest request;

    @BeforeEach
    public void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/test");
    }

    @Test
    public void testHandleResourceNotFoundException() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Session not found");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFound(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getMessage()).isEqualTo("Session not found");
        assertThat(response.getBody().getPath()).isEqualTo("/api/test");
    }

    @Test
    public void testHandleSessionFullException() {
        SessionFullException ex = new SessionFullException("Session has reached maximum capacity");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleSessionFull(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getMessage()).isEqualTo("Session has reached maximum capacity");
    }

    @Test
    public void testHandleInvalidSessionStateException() {
        InvalidSessionStateException ex = new InvalidSessionStateException("Session is not in WAITING state");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleInvalidSessionState(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getMessage()).isEqualTo("Session is not in WAITING state");
    }

    @Test
    public void testHandleDuplicateDisplayNameException() {
        DuplicateDisplayNameException ex = new DuplicateDisplayNameException("Display name already taken");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleDuplicateDisplayName(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getMessage()).isEqualTo("Display name already taken");
    }
}
