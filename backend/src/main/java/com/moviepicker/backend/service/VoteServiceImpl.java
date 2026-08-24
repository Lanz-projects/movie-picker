package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.CastVoteRequest;
import com.moviepicker.backend.dto.RoomEventType;
import com.moviepicker.backend.dto.RoomProgressEvent;
import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.dto.UserVotingProgressDto;
import com.moviepicker.backend.dto.VoteResponse;
import com.moviepicker.backend.dto.VotingProgressResponse;
import com.moviepicker.backend.exception.DuplicateVoteException;
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

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoteServiceImpl implements VoteService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final MovieSuggestionRepository movieSuggestionRepository;
    private final VoteRepository voteRepository;
    private final ConsensusService consensusService;
    private final RoomEventPublisher roomEventPublisher;

    @Override
    @Transactional
    public VoteResponse castVoteAndBroadcast(Long sessionId, CastVoteRequest request) {
        VoteResponse response = castVote(sessionId, request);
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));
        VotingProgressResponse progress = getVotingProgress(sessionId);

        RoomEventType eventType = RoomEventType.VOTE_CAST;
        if (progress.isAllUsersCompleted()) {
            eventType = RoomEventType.ALL_VOTING_COMPLETED;
        } else {
            boolean userCompleted = progress.getUsers().stream()
                    .filter(u -> u.getUserId().equals(request.getUserId()))
                    .anyMatch(UserVotingProgressDto::isCompleted);
            if (userCompleted) {
                eventType = RoomEventType.USER_COMPLETED;
            }
        }

        RoomProgressEvent event = RoomProgressEvent.builder()
                .eventType(eventType)
                .roomCode(session.getRoomCode())
                .userId(response.getUserId())
                .userDisplayName(response.getUserDisplayName())
                .movieSuggestionId(response.getMovieSuggestionId())
                .tmdbId(response.getTmdbId())
                .movieTitle(response.getMovieTitle())
                .voteType(response.getVoteType())
                .progress(progress)
                .build();

        roomEventPublisher.publishVoteProgress(session.getRoomCode(), event);

        if (progress.isAllUsersCompleted()) {
            SessionResultsResponse results = consensusService.calculateResults(session.getId());
            roomEventPublisher.publishResults(session.getRoomCode(), results);
        }

        return response;
    }

    @Override
    @Transactional
    public VoteResponse castVoteAndBroadcastByRoomCode(String roomCode, CastVoteRequest request) {
        Session session = sessionRepository.findByRoomCode(roomCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with room code: " + roomCode));
        return castVoteAndBroadcast(session.getId(), request);
    }

    @Override
    @Transactional
    public VoteResponse castVote(Long sessionId, CastVoteRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        if (session.getStatus() != SessionStatus.VOTING) {
            throw new InvalidSessionStateException("Cannot cast votes when session is in " + session.getStatus() + " status");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        if (!user.getSession().getId().equals(session.getId())) {
            throw new InvalidSessionStateException("User does not belong to this session");
        }

        MovieSuggestion movieSuggestion = movieSuggestionRepository.findById(request.getMovieSuggestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie suggestion not found with id: " + request.getMovieSuggestionId()));

        if (!movieSuggestion.getSession().getId().equals(session.getId())) {
            throw new InvalidSessionStateException("Movie suggestion does not belong to this session");
        }

        if (voteRepository.existsByUserIdAndMovieSuggestionId(user.getId(), movieSuggestion.getId())) {
            throw new DuplicateVoteException("User '" + user.getDisplayName() + "' has already voted on movie '" + movieSuggestion.getTitle() + "'");
        }

        Vote vote = Vote.builder()
                .session(session)
                .user(user)
                .movieSuggestion(movieSuggestion)
                .voteType(request.getVoteType())
                .build();

        Vote savedVote = voteRepository.save(vote);
        log.info("Vote recorded: user='{}', movie='{}', voteType={}", user.getDisplayName(), movieSuggestion.getTitle(), request.getVoteType());

        return VoteResponse.fromEntity(savedVote);
    }

    @Override
    @Transactional(readOnly = true)
    public VotingProgressResponse getVotingProgress(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        List<MovieSuggestion> movies = movieSuggestionRepository.findBySessionId(sessionId);
        List<User> users = userRepository.findBySessionId(sessionId);

        // Fetch vote counts grouped by user in 1 single aggregation query
        List<Object[]> voteCounts = voteRepository.countVotesGroupedByUserId(sessionId);
        java.util.Map<Long, Long> votesByUser = voteCounts.stream()
                .filter(row -> row[0] != null && row[1] != null)
                .collect(java.util.stream.Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue(),
                        (existing, replacement) -> existing
                ));

        int totalMovies = movies.size();
        int totalUsers = users.size();
        List<UserVotingProgressDto> userProgressList = new ArrayList<>(users.size());
        int completedUserCount = 0;

        for (User user : users) {
            long votesCast = votesByUser.getOrDefault(user.getId(), 0L);
            boolean isCompleted = totalMovies > 0 && votesCast >= totalMovies;
            if (isCompleted) {
                completedUserCount++;
            }
            userProgressList.add(UserVotingProgressDto.builder()
                    .userId(user.getId())
                    .displayName(user.getDisplayName())
                    .votedCount(votesCast)
                    .completed(isCompleted)
                    .build());
        }

        boolean allCompleted = totalUsers > 0 && completedUserCount == totalUsers;

        return VotingProgressResponse.builder()
                .sessionId(session.getId())
                .roomCode(session.getRoomCode())
                .totalMovies(totalMovies)
                .totalUsers(totalUsers)
                .completedUserCount(completedUserCount)
                .allUsersCompleted(allCompleted)
                .users(userProgressList)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VotingProgressResponse getVotingProgressByRoomCode(String roomCode) {
        Session session = sessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with room code: " + roomCode));
        return getVotingProgress(session.getId());
    }
}
