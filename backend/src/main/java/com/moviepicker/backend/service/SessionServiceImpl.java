package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.exception.DuplicateDisplayNameException;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.exception.SessionFullException;
import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.model.Vote;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.repository.VoteRepository;
import com.moviepicker.backend.util.RoomCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final MovieSuggestionRepository movieSuggestionRepository;
    private final VoteRepository voteRepository;
    private final VoteService voteService;
    private final ConsensusService consensusService;
    private final RoomCodeGenerator roomCodeGenerator;
    private final RoomEventPublisher roomEventPublisher;

    private static final int MAX_ROOM_CODE_RETRIES = 5;

    @Override
    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        String roomCode = generateUniqueRoomCode();

        Session session = Session.builder()
                .roomCode(roomCode)
                .hostName(request.getHostName())
                .maxUsers(request.getMaxUsers() != null ? request.getMaxUsers() : 10)
                .maxSuggestionsPerUser(request.getMaxSuggestionsPerUser() != null ? request.getMaxSuggestionsPerUser() : 5)
                .status(SessionStatus.WAITING)
                .build();

        Session savedSession = sessionRepository.save(session);

        // Host is automatically added as first user
        User hostUser = User.builder()
                .session(savedSession)
                .displayName(request.getHostName())
                .build();
        userRepository.save(hostUser);

        List<User> users = userRepository.findBySessionId(savedSession.getId());
        return SessionResponse.fromEntity(savedSession, users);
    }

    @Override
    @Transactional(readOnly = true)
    public SessionResponse getSessionByRoomCode(String roomCode) {
        Session session = findSessionByRoomCodeOrThrow(roomCode);
        List<User> users = userRepository.findBySessionId(session.getId());
        return SessionResponse.fromEntity(session, users);
    }

    @Override
    @Transactional
    public SessionResponse joinSession(JoinSessionRequest request) {
        Session session = findSessionByRoomCodeOrThrow(request.getRoomCode());

        if (session.getStatus() != SessionStatus.WAITING && session.getStatus() != SessionStatus.SUGGESTING) {
            throw new InvalidSessionStateException("Cannot join session in " + session.getStatus() + " state");
        }

        String cleanName = request.getDisplayName().trim();

        // 1. Check permanent ban list
        if (session.getBannedDisplayNames() != null && session.getBannedDisplayNames().stream()
                .anyMatch(name -> name.equalsIgnoreCase(cleanName))) {
            throw new InvalidSessionStateException("You have been permanently banned from this session by the host.");
        }

        // 2. Check current-round lockout
        if (session.getStatus() != SessionStatus.WAITING &&
                session.getRoundKickedDisplayNames() != null &&
                session.getRoundKickedDisplayNames().stream().anyMatch(name -> name.equalsIgnoreCase(cleanName))) {
            throw new InvalidSessionStateException("You were removed from this round. You can rejoin once the host returns to the lobby.");
        }

        List<User> existingUsers = userRepository.findBySessionId(session.getId());

        if (existingUsers.size() >= session.getMaxUsers()) {
            throw new SessionFullException("Session is full (max limit: " + session.getMaxUsers() + ")");
        }

        boolean nameExists = existingUsers.stream()
                .anyMatch(u -> u.getDisplayName().equalsIgnoreCase(cleanName));
        if (nameExists) {
            throw new DuplicateDisplayNameException("Display name '" + request.getDisplayName() + "' is already taken in this session");
        }

        User newUser = User.builder()
                .session(session)
                .displayName(cleanName)
                .build();
        User savedUser = userRepository.save(newUser);

        List<User> updatedUsers = userRepository.findBySessionId(session.getId());
        List<UserResponse> userResponses = updatedUsers.stream()
                .map(u -> UserResponse.fromEntity(u, session.getKickCounts() != null ? session.getKickCounts().getOrDefault(u.getDisplayName().trim().toLowerCase(), 0) : 0))
                .collect(Collectors.toList());

        roomEventPublisher.publishUserJoined(session.getRoomCode(), savedUser.getId(), savedUser.getDisplayName(), session.getHostName(), userResponses);

        return SessionResponse.fromEntity(session, updatedUsers);
    }

    @Override
    @Transactional
    public SessionResponse updateSessionStatus(String roomCode, UpdateSessionStatusRequest request) {
        Session session = findSessionByRoomCodeOrThrow(roomCode);
        session.setStatus(request.getStatus());

        if (request.getStatus() == SessionStatus.WAITING && session.getRoundKickedDisplayNames() != null) {
            session.getRoundKickedDisplayNames().clear();
        }

        Session updatedSession = sessionRepository.save(session);

        List<User> users = userRepository.findBySessionId(updatedSession.getId());
        List<UserResponse> userResponses = users.stream()
                .map(u -> UserResponse.fromEntity(u, updatedSession.getKickCounts() != null ? updatedSession.getKickCounts().getOrDefault(u.getDisplayName().trim().toLowerCase(), 0) : 0))
                .collect(Collectors.toList());

        roomEventPublisher.publishStageChanged(session.getRoomCode(), updatedSession.getStatus(), userResponses);

        return SessionResponse.fromEntity(updatedSession, users);
    }

    @Override
    @Transactional
    public LeaveSessionResponse leaveSession(Long sessionId, LeaveSessionRequest request) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        if (!user.getSession().getId().equals(session.getId())) {
            throw new InvalidSessionStateException("User does not belong to this session");
        }

        // 1. Delete all votes cast by this user in this session
        List<Vote> userVotes = voteRepository.findBySessionIdAndUserId(session.getId(), user.getId());
        if (!userVotes.isEmpty()) {
            voteRepository.deleteAll(userVotes);
        }

        // 2. Disassociate user from movie suggestions to preserve pool data
        List<MovieSuggestion> userSuggestions = movieSuggestionRepository.findByUserId(user.getId());
        if (!userSuggestions.isEmpty()) {
            for (MovieSuggestion suggestion : userSuggestions) {
                suggestion.setUser(null);
            }
            movieSuggestionRepository.saveAll(userSuggestions);
        }

        boolean wasHost = session.getHostName().equalsIgnoreCase(user.getDisplayName().trim());
        String departingUserName = user.getDisplayName();

        userRepository.delete(user);

        List<User> remainingUsers = userRepository.findBySessionIdOrderByJoinedAtAsc(sessionId);
        String message;

        if (remainingUsers.isEmpty()) {
            session.setStatus(SessionStatus.COMPLETED);
            sessionRepository.save(session);
            message = "User '" + departingUserName + "' left. Session is now empty and has been marked completed.";
            log.info("Session id={} is now empty after user departure, status set to COMPLETED", sessionId);
        } else if (wasHost) {
            User newHost = remainingUsers.get(0);
            session.setHostName(newHost.getDisplayName());
            sessionRepository.save(session);
            message = "Host '" + departingUserName + "' left. Host role transferred to '" + newHost.getDisplayName() + "'.";
            log.info("Host left session id={}, new host is '{}'", sessionId, newHost.getDisplayName());
        } else {
            message = "User '" + departingUserName + "' left the session.";
            log.info("User '{}' left session id={}", departingUserName, sessionId);
        }

        List<UserResponse> userResponses = remainingUsers.stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());

        LeaveSessionResponse response = LeaveSessionResponse.builder()
                .sessionId(session.getId())
                .roomCode(session.getRoomCode())
                .hostName(session.getHostName())
                .status(session.getStatus())
                .remainingUserCount(remainingUsers.size())
                .remainingUsers(userResponses)
                .message(message)
                .build();

        roomEventPublisher.publishUserLeft(session.getRoomCode(), response);

        return response;
    }

    @Override
    @Transactional
    public LeaveSessionResponse leaveSessionByRoomCode(String roomCode, LeaveSessionRequest request) {
        Session session = findSessionByRoomCodeOrThrow(roomCode);
        return leaveSession(session.getId(), request);
    }

    @Override
    @Transactional
    public LeaveSessionResponse kickUser(String roomCode, KickUserRequest request) {
        Session session = findSessionByRoomCodeOrThrow(roomCode);

        User hostUser = userRepository.findById(request.getHostUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Host user not found with id: " + request.getHostUserId()));

        if (!hostUser.getSession().getId().equals(session.getId())) {
            throw new InvalidSessionStateException("Host does not belong to this session");
        }

        if (!session.getHostName().equalsIgnoreCase(hostUser.getDisplayName().trim())) {
            throw new InvalidSessionStateException("Only the room host can kick members");
        }

        User targetUser = userRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found with id: " + request.getTargetUserId()));

        if (!targetUser.getSession().getId().equals(session.getId())) {
            throw new InvalidSessionStateException("Target user does not belong to this session");
        }

        if (targetUser.getId().equals(hostUser.getId())) {
            throw new InvalidSessionStateException("Host cannot kick themselves. Use leave session instead.");
        }

        String kickedUserName = targetUser.getDisplayName();
        Long kickedUserId = targetUser.getId();
        String cleanKickedName = kickedUserName.trim().toLowerCase();

        // Track kick counts and bans
        if (session.getKickCounts() == null) {
            session.setKickCounts(new java.util.HashMap<>());
        }
        int kickCount = session.getKickCounts().getOrDefault(cleanKickedName, 0) + 1;
        session.getKickCounts().put(cleanKickedName, kickCount);

        boolean isPermanentBan = Boolean.TRUE.equals(request.getBanPermanently());
        if (isPermanentBan) {
            if (session.getBannedDisplayNames() == null) {
                session.setBannedDisplayNames(new java.util.HashSet<>());
            }
            session.getBannedDisplayNames().add(cleanKickedName);
            log.info("User '{}' (id={}) was permanently banned from session id={} (roomCode={}) by host '{}'",
                    kickedUserName, kickedUserId, session.getId(), session.getRoomCode(), hostUser.getDisplayName());
        } else {
            if (session.getRoundKickedDisplayNames() == null) {
                session.setRoundKickedDisplayNames(new java.util.HashSet<>());
            }
            session.getRoundKickedDisplayNames().add(cleanKickedName);
            log.info("User '{}' (id={}) was kicked from round in session id={} (roomCode={}, kickCount={}) by host '{}'",
                    kickedUserName, kickedUserId, session.getId(), session.getRoomCode(), kickCount, hostUser.getDisplayName());
        }
        sessionRepository.save(session);

        // 1. Delete all votes cast by the target user in this session
        List<Vote> userVotes = voteRepository.findBySessionIdAndUserId(session.getId(), targetUser.getId());
        if (!userVotes.isEmpty()) {
            voteRepository.deleteAll(userVotes);
        }

        // 2. Disassociate user from movie suggestions to preserve pool data and prevent FK violations
        List<MovieSuggestion> userSuggestions = movieSuggestionRepository.findByUserId(targetUser.getId());
        if (!userSuggestions.isEmpty()) {
            for (MovieSuggestion suggestion : userSuggestions) {
                suggestion.setUser(null);
            }
            movieSuggestionRepository.saveAll(userSuggestions);
        }

        // 3. Delete the user entity
        userRepository.delete(targetUser);

        List<User> remainingUsers = userRepository.findBySessionIdOrderByJoinedAtAsc(session.getId());
        List<UserResponse> userResponses = remainingUsers.stream()
                .map(u -> UserResponse.fromEntity(u, session.getKickCounts().getOrDefault(u.getDisplayName().trim().toLowerCase(), 0)))
                .collect(Collectors.toList());

        String message = isPermanentBan
                ? "User '" + kickedUserName + "' was permanently banned from the session by the host."
                : "User '" + kickedUserName + "' was removed from the session by the host.";

        LeaveSessionResponse response = LeaveSessionResponse.builder()
                .sessionId(session.getId())
                .roomCode(session.getRoomCode())
                .hostName(session.getHostName())
                .status(session.getStatus())
                .remainingUserCount(remainingUsers.size())
                .remainingUsers(userResponses)
                .message(message)
                .build();

        roomEventPublisher.publishUserKicked(session.getRoomCode(), kickedUserId, kickedUserName, response);

        // If in VOTING stage and remaining users have all finished voting, trigger consensus results
        if (session.getStatus() == SessionStatus.VOTING && !remainingUsers.isEmpty()) {
            VotingProgressResponse progress = voteService.getVotingProgress(session.getId());
            if (progress.isAllUsersCompleted() && progress.getTotalMovies() > 0) {
                RoomProgressEvent allCompletedEvent = RoomProgressEvent.builder()
                        .eventType(RoomEventType.ALL_VOTING_COMPLETED)
                        .roomCode(session.getRoomCode())
                        .sessionStatus(session.getStatus())
                        .progress(progress)
                        .message("All remaining users completed voting.")
                        .build();
                roomEventPublisher.publishVoteProgress(session.getRoomCode(), allCompletedEvent);
                SessionResultsResponse results = consensusService.calculateResults(session.getId());
                roomEventPublisher.publishResults(session.getRoomCode(), results);
            }
        }

        return response;
    }

    private Session findSessionByRoomCodeOrThrow(String roomCode) {
        return sessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with room code: " + roomCode));
    }

    private String generateUniqueRoomCode() {
        for (int i = 0; i < MAX_ROOM_CODE_RETRIES; i++) {
            String code = roomCodeGenerator.generate();
            if (!sessionRepository.existsByRoomCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate a unique room code after multiple retries");
    }
}
