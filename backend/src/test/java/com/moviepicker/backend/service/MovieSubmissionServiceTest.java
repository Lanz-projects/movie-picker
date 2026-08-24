package com.moviepicker.backend.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.moviepicker.backend.dto.MovieSubmissionDto;
import com.moviepicker.backend.dto.MovieSuggestionResponse;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.SubmitMoviesRequest;
import com.moviepicker.backend.exception.EmptyMoviePoolException;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.exception.MovieSuggestionLimitExceededException;
import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class MovieSubmissionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MovieSuggestionRepository movieSuggestionRepository;

    @Mock
    private RoomEventPublisher roomEventPublisher;

    @InjectMocks
    private MovieSubmissionServiceImpl movieSubmissionService;

    private Session sampleSession;
    private User sampleUser;
    private MovieSubmissionDto movieDto1;
    private MovieSubmissionDto movieDto2;

    @BeforeEach
    public void setUp() {
        sampleSession = Session.builder()
                .id(1L)
                .roomCode("SUBMIT")
                .hostName("Alice")
                .status(SessionStatus.WAITING)
                .maxUsers(10)
                .maxSuggestionsPerUser(5)
                .createdAt(LocalDateTime.now())
                .build();

        sampleUser = User.builder()
                .id(10L)
                .session(sampleSession)
                .displayName("Alice")
                .joinedAt(LocalDateTime.now())
                .build();

        movieDto1 = MovieSubmissionDto.builder()
                .tmdbId(550L)
                .title("Fight Club")
                .overview("Insomniac...")
                .posterPath("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg")
                .releaseYear(1999)
                .build();

        movieDto2 = MovieSubmissionDto.builder()
                .tmdbId(27205L)
                .title("Inception")
                .overview("Thief...")
                .posterPath("/xlaY2zyzMfkhk0SuCQQB6usEjip.jpg")
                .releaseYear(2010)
                .build();
    }

    @Test
    public void testSubmitMovies_Success() {
        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(sampleUser.getId())
                .movies(List.of(movieDto1, movieDto2))
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(movieSuggestionRepository.countBySessionIdAndUserId(1L, 10L)).thenReturn(0L);
        when(movieSuggestionRepository.findExistingTmdbIdsBySessionId(1L)).thenReturn(Collections.emptySet());

        MovieSuggestion saved1 = MovieSuggestion.builder()
                .id(100L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        MovieSuggestion saved2 = MovieSuggestion.builder()
                .id(101L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(27205L)
                .title("Inception")
                .build();

        when(movieSuggestionRepository.saveAll(any())).thenReturn(List.of(saved1, saved2));

        List<MovieSuggestionResponse> responses = movieSubmissionService.submitMovies(1L, request);

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getTitle()).isEqualTo("Fight Club");
        assertThat(responses.get(1).getTitle()).isEqualTo("Inception");
        verify(movieSuggestionRepository).saveAll(any());
    }

    @Test
    public void testSubmitMovies_AllowsLessThanMax() {
        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(sampleUser.getId())
                .movies(List.of(movieDto1)) // submitting only 1 movie (max is 5)
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(movieSuggestionRepository.countBySessionIdAndUserId(1L, 10L)).thenReturn(0L);
        when(movieSuggestionRepository.findExistingTmdbIdsBySessionId(1L)).thenReturn(Collections.emptySet());

        MovieSuggestion saved1 = MovieSuggestion.builder()
                .id(100L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        when(movieSuggestionRepository.saveAll(any())).thenReturn(List.of(saved1));

        List<MovieSuggestionResponse> responses = movieSubmissionService.submitMovies(1L, request);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Fight Club");
    }

    @Test
    public void testSubmitMovies_ExceedsLimitThrowsException() {
        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(sampleUser.getId())
                .movies(List.of(movieDto1, movieDto2))
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(movieSuggestionRepository.countBySessionIdAndUserId(1L, 10L)).thenReturn(4L); // 4 + 2 = 6 > max 5

        assertThatThrownBy(() -> movieSubmissionService.submitMovies(1L, request))
                .isInstanceOf(MovieSuggestionLimitExceededException.class)
                .hasMessageContaining("exceeds maximum allowed quota");

        verify(movieSuggestionRepository, never()).save(any(MovieSuggestion.class));
    }

    @Test
    public void testSubmitMovies_DeduplicatesRoomDuplicates() {
        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(sampleUser.getId())
                .movies(List.of(movieDto1, movieDto2))
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(movieSuggestionRepository.countBySessionIdAndUserId(1L, 10L)).thenReturn(0L);
        when(movieSuggestionRepository.findExistingTmdbIdsBySessionId(1L)).thenReturn(java.util.Set.of(550L)); // Already suggested by another user

        MovieSuggestion saved2 = MovieSuggestion.builder()
                .id(101L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(27205L)
                .title("Inception")
                .build();

        when(movieSuggestionRepository.saveAll(any())).thenReturn(List.of(saved2));

        List<MovieSuggestionResponse> responses = movieSubmissionService.submitMovies(1L, request);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Inception");
    }

    @Test
    public void testGetSessionMovies_Success() {
        MovieSuggestion saved1 = MovieSuggestion.builder()
                .id(100L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        when(sessionRepository.existsById(1L)).thenReturn(true);
        when(movieSuggestionRepository.findBySessionIdWithUser(1L)).thenReturn(List.of(saved1));

        List<MovieSuggestionResponse> responses = movieSubmissionService.getSessionMovies(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Fight Club");
    }

    @Test
    public void testSubmitMovies_InvalidSessionStateThrowsException() {
        sampleSession.setStatus(SessionStatus.VOTING);
        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(sampleUser.getId())
                .movies(List.of(movieDto1))
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));

        assertThatThrownBy(() -> movieSubmissionService.submitMovies(1L, request))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("Cannot submit movies when session is in VOTING status");
    }

    @Test
    public void testStartVoting_Success() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));

        MovieSuggestion existingMovie = MovieSuggestion.builder()
                .id(100L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        when(movieSuggestionRepository.findBySessionId(1L)).thenReturn(List.of(existingMovie));
        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(sampleUser));

        SessionResponse response = movieSubmissionService.startVoting(1L);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(SessionStatus.VOTING);
        verify(sessionRepository).save(sampleSession);
    }

    @Test
    public void testStartVoting_EmptyPoolThrowsException() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(movieSuggestionRepository.findBySessionId(1L)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> movieSubmissionService.startVoting(1L))
                .isInstanceOf(EmptyMoviePoolException.class)
                .hasMessageContaining("zero submitted movies");

        verify(sessionRepository, never()).save(any(Session.class));
    }

    @Test
    public void testSubmitMovies_DeduplicatesSameMovieWithinSingleBatch() {
        // User submits duplicate Fight Club twice in same payload
        SubmitMoviesRequest request = SubmitMoviesRequest.builder()
                .userId(sampleUser.getId())
                .movies(List.of(movieDto1, movieDto1))
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(sampleSession));
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(movieSuggestionRepository.countBySessionIdAndUserId(1L, 10L)).thenReturn(0L);
        when(movieSuggestionRepository.findExistingTmdbIdsBySessionId(1L)).thenReturn(new java.util.HashSet<>());

        MovieSuggestion saved1 = MovieSuggestion.builder()
                .id(100L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        when(movieSuggestionRepository.saveAll(any())).thenReturn(List.of(saved1));

        List<MovieSuggestionResponse> responses = movieSubmissionService.submitMovies(1L, request);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Fight Club");
    }

    @Test
    public void testGetSessionMovies_DeduplicatesByTmdbId() {
        MovieSuggestion movieA = MovieSuggestion.builder()
                .id(100L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        MovieSuggestion movieB = MovieSuggestion.builder()
                .id(101L)
                .session(sampleSession)
                .user(sampleUser)
                .tmdbId(550L) // Duplicate TMDB id
                .title("Fight Club")
                .build();

        when(sessionRepository.existsById(1L)).thenReturn(true);
        when(movieSuggestionRepository.findBySessionIdWithUser(1L)).thenReturn(List.of(movieA, movieB));

        List<MovieSuggestionResponse> responses = movieSubmissionService.getSessionMovies(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTmdbId()).isEqualTo(550L);
    }
}
