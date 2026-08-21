package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.MovieSubmissionDto;
import com.moviepicker.backend.dto.MovieSuggestionResponse;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.SubmitMoviesRequest;
import com.moviepicker.backend.dto.UserResponse;
import com.moviepicker.backend.exception.EmptyMoviePoolException;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.exception.MovieSuggestionLimitExceededException;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovieSubmissionServiceImpl implements MovieSubmissionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final MovieSuggestionRepository movieSuggestionRepository;
    private final RoomEventPublisher roomEventPublisher;

    @Override
    @Transactional
    public List<MovieSuggestionResponse> submitMovies(Long sessionId, SubmitMoviesRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        if (session.getStatus() != SessionStatus.WAITING && session.getStatus() != SessionStatus.SUGGESTING) {
            throw new InvalidSessionStateException("Cannot submit movies when session is in " + session.getStatus() + " status");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        if (!user.getSession().getId().equals(session.getId())) {
            throw new InvalidSessionStateException("User does not belong to this session");
        }

        long existingCount = movieSuggestionRepository.countBySessionIdAndUserId(sessionId, user.getId());
        int incomingCount = request.getMovies() != null ? request.getMovies().size() : 0;

        if (existingCount + incomingCount > session.getMaxSuggestionsPerUser()) {
            throw new MovieSuggestionLimitExceededException(
                    String.format("Submitting %d movie(s) exceeds maximum allowed quota of %d per user (current: %d)",
                            incomingCount, session.getMaxSuggestionsPerUser(), existingCount));
        }

        List<MovieSuggestion> savedSuggestions = new ArrayList<>();
        if (request.getMovies() != null && !request.getMovies().isEmpty()) {
            java.util.Set<Long> existingTmdbIds = new java.util.HashSet<>(
                    movieSuggestionRepository.findExistingTmdbIdsBySessionId(sessionId)
            );
            List<MovieSuggestion> toSave = new ArrayList<>();
            List<MovieSuggestion> toUpdate = new ArrayList<>();

            for (MovieSubmissionDto movieDto : request.getMovies()) {
                if (existingTmdbIds.contains(movieDto.getTmdbId())) {
                    log.info("Movie tmdbId={} already exists in session id={}, adding user id={} to nominators",
                            movieDto.getTmdbId(), sessionId, user.getId());
                    movieSuggestionRepository.findBySessionIdAndTmdbIdWithNominators(sessionId, movieDto.getTmdbId())
                            .ifPresent(existingSuggestion -> {
                                if (existingSuggestion.getNominators() == null) {
                                    existingSuggestion.setNominators(new java.util.HashSet<>());
                                }
                                existingSuggestion.getNominators().add(user);
                                toUpdate.add(existingSuggestion);
                            });
                    continue;
                }

                java.util.Set<User> nominatorsSet = new java.util.HashSet<>();
                nominatorsSet.add(user);

                MovieSuggestion suggestion = MovieSuggestion.builder()
                        .session(session)
                        .user(user)
                        .nominators(nominatorsSet)
                        .tmdbId(movieDto.getTmdbId())
                        .title(movieDto.getTitle())
                        .overview(movieDto.getOverview())
                        .posterPath(movieDto.getPosterPath())
                        .releaseYear(movieDto.getReleaseYear())
                        .build();

                toSave.add(suggestion);
                existingTmdbIds.add(movieDto.getTmdbId());
            }

            if (!toSave.isEmpty()) {
                savedSuggestions.addAll(movieSuggestionRepository.saveAll(toSave));
            }
            if (!toUpdate.isEmpty()) {
                savedSuggestions.addAll(movieSuggestionRepository.saveAll(toUpdate));
            }
        }

        List<User> users = userRepository.findBySessionId(sessionId);
        List<MovieSuggestion> allSuggestions = movieSuggestionRepository.findBySessionIdWithUser(sessionId);
        long submittedUsersCount = allSuggestions.stream()
                .map(s -> s.getUser() != null ? s.getUser().getId() : null)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();

        roomEventPublisher.publishDeckSubmitted(
                session.getRoomCode(),
                user.getId(),
                user.getDisplayName(),
                (int) submittedUsersCount,
                users.size()
        );

        return savedSuggestions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovieSuggestionResponse> getSessionMovies(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Session not found with id: " + sessionId);
        }

        List<MovieSuggestion> allSuggestions = movieSuggestionRepository.findBySessionIdWithUser(sessionId);
        java.util.Set<Long> seenTmdbIds = new java.util.HashSet<>();
        List<MovieSuggestionResponse> uniqueMovies = new ArrayList<>();

        for (MovieSuggestion suggestion : allSuggestions) {
            Long key = suggestion.getTmdbId();
            if (key == null || seenTmdbIds.add(key)) {
                uniqueMovies.add(mapToResponse(suggestion));
            }
        }

        return uniqueMovies;
    }

    @Override
    @Transactional
    public SessionResponse startVoting(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        if (session.getStatus() != SessionStatus.WAITING && session.getStatus() != SessionStatus.SUGGESTING) {
            throw new InvalidSessionStateException("Cannot start voting when session is in " + session.getStatus() + " status");
        }

        List<MovieSuggestion> suggestions = movieSuggestionRepository.findBySessionId(sessionId);
        if (suggestions.isEmpty()) {
            throw new EmptyMoviePoolException("Cannot start voting with zero submitted movies");
        }

        session.setStatus(SessionStatus.VOTING);
        Session updatedSession = sessionRepository.save(session);
        List<User> users = userRepository.findBySessionId(sessionId);
        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());

        roomEventPublisher.publishStageChanged(session.getRoomCode(), updatedSession.getStatus(), userResponses);

        return SessionResponse.fromEntity(updatedSession, users);
    }

    private MovieSuggestionResponse mapToResponse(MovieSuggestion suggestion) {
        List<String> nominatorNames = new ArrayList<>();
        if (suggestion.getNominators() != null && !suggestion.getNominators().isEmpty()) {
            nominatorNames = suggestion.getNominators().stream()
                    .map(User::getDisplayName)
                    .filter(org.springframework.util.StringUtils::hasText)
                    .distinct()
                    .collect(Collectors.toList());
        }
        if (nominatorNames.isEmpty() && suggestion.getUser() != null && org.springframework.util.StringUtils.hasText(suggestion.getUser().getDisplayName())) {
            nominatorNames = List.of(suggestion.getUser().getDisplayName());
        }

        return MovieSuggestionResponse.builder()
                .id(suggestion.getId())
                .tmdbId(suggestion.getTmdbId())
                .userId(suggestion.getUser() != null ? suggestion.getUser().getId() : null)
                .userDisplayName(suggestion.getUser() != null ? suggestion.getUser().getDisplayName() : null)
                .nominators(nominatorNames)
                .title(suggestion.getTitle())
                .overview(suggestion.getOverview())
                .posterPath(suggestion.getPosterPath())
                .releaseYear(suggestion.getReleaseYear())
                .suggestedAt(suggestion.getSuggestedAt())
                .build();
    }
}
