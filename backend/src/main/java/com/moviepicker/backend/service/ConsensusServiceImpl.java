package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.ScoredMovieDto;
import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.model.*;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsensusServiceImpl implements ConsensusService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final MovieSuggestionRepository movieSuggestionRepository;
    private final VoteRepository voteRepository;

    @Override
    @Transactional
    public SessionResultsResponse calculateResults(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        if (session.getStatus() == SessionStatus.WAITING) {
            throw new InvalidSessionStateException("Cannot calculate results when session is in WAITING status");
        }

        SessionResultsResponse response = buildResultsResponse(session);

        if (session.getStatus() != SessionStatus.COMPLETED) {
            session.setStatus(SessionStatus.COMPLETED);
            sessionRepository.save(session);
            log.info("Session id={} status transitioned to COMPLETED. Winner: '{}'",
                    session.getId(), response.getWinner() != null ? response.getWinner().getTitle() : "None");
        }

        return response;
    }

    @Override
    @Transactional
    public SessionResultsResponse calculateResultsByRoomCode(String roomCode) {
        Session session = sessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with room code: " + roomCode));
        return calculateResults(session.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public SessionResultsResponse getResults(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new InvalidSessionStateException("Results are only available for COMPLETED sessions");
        }

        return buildResultsResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public SessionResultsResponse getResultsByRoomCode(String roomCode) {
        Session session = sessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with room code: " + roomCode));
        return getResults(session.getId());
    }

    private SessionResultsResponse buildResultsResponse(Session session) {
        List<MovieSuggestion> movies = movieSuggestionRepository.findBySessionId(session.getId());
        List<User> users = userRepository.findBySessionId(session.getId());

        int totalParticipants = users.size();
        List<ScoredMovieDto> scoredMovies = new ArrayList<>();

        for (MovieSuggestion movie : movies) {
            List<Vote> votes = voteRepository.findBySessionIdAndMovieSuggestionId(session.getId(), movie.getId());

            long yesVotes = votes.stream().filter(v -> v.getVoteType() == VoteType.YES || v.getVoteType() == VoteType.LIKE).count();
            long superlikeVotes = votes.stream().filter(v -> v.getVoteType() == VoteType.SUPERLIKE).count();
            long noVotes = votes.stream().filter(v -> v.getVoteType() == VoteType.NO || v.getVoteType() == VoteType.PASS).count();
            long skipVotes = votes.stream().filter(v -> v.getVoteType() == VoteType.SKIP).count();

            int score = (int) ((yesVotes * 1) + (superlikeVotes * 2));
            long positiveVotersCount = yesVotes + superlikeVotes;

            double matchPercentage = totalParticipants > 0
                    ? Math.round(((double) positiveVotersCount / totalParticipants) * 1000.0) / 10.0
                    : 0.0;

            boolean isUnanimous = totalParticipants > 0 && positiveVotersCount == totalParticipants;

            List<String> positiveVoters = votes.stream()
                    .filter(v -> v.getVoteType() == VoteType.YES || v.getVoteType() == VoteType.LIKE || v.getVoteType() == VoteType.SUPERLIKE)
                    .map(v -> v.getUser() != null ? v.getUser().getDisplayName() : null)
                    .filter(org.springframework.util.StringUtils::hasText)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());

            List<String> superlikers = votes.stream()
                    .filter(v -> v.getVoteType() == VoteType.SUPERLIKE)
                    .map(v -> v.getUser() != null ? v.getUser().getDisplayName() : null)
                    .filter(org.springframework.util.StringUtils::hasText)
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());

            String suggestedBy = movie.getUser() != null ? movie.getUser().getDisplayName() : null;

            scoredMovies.add(ScoredMovieDto.builder()
                    .movieSuggestionId(movie.getId())
                    .tmdbId(movie.getTmdbId())
                    .title(movie.getTitle())
                    .posterPath(movie.getPosterPath())
                    .overview(movie.getOverview())
                    .releaseYear(movie.getReleaseYear())
                    .suggestedBy(suggestedBy)
                    .score(score)
                    .yesVotes(yesVotes)
                    .superlikeVotes(superlikeVotes)
                    .noVotes(noVotes)
                    .skipVotes(skipVotes)
                    .matchPercentage(matchPercentage)
                    .isUnanimous(isUnanimous)
                    .positiveVoters(positiveVoters)
                    .superlikers(superlikers)
                    .build());
        }

        // Sort hierarchy: score DESC -> superlikeVotes DESC -> yesVotes DESC -> movieSuggestionId ASC
        scoredMovies.sort(Comparator
                .comparingInt(ScoredMovieDto::getScore).reversed()
                .thenComparing(Comparator.comparingLong(ScoredMovieDto::getSuperlikeVotes).reversed())
                .thenComparing(Comparator.comparingLong(ScoredMovieDto::getYesVotes).reversed())
                .thenComparing(ScoredMovieDto::getMovieSuggestionId, Comparator.nullsLast(Comparator.naturalOrder())));

        ScoredMovieDto winner = scoredMovies.isEmpty() ? null : scoredMovies.get(0);

        return SessionResultsResponse.builder()
                .sessionId(session.getId())
                .roomCode(session.getRoomCode())
                .totalParticipants(totalParticipants)
                .totalMovies(movies.size())
                .winner(winner)
                .rankedMovies(scoredMovies)
                .calculatedAt(LocalDateTime.now())
                .build();
    }
}
