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
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
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
    private final RoomCodeGenerator roomCodeGenerator;

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

        if (session.getStatus() != SessionStatus.WAITING) {
            throw new InvalidSessionStateException("Cannot join session in " + session.getStatus() + " state");
        }

        List<User> existingUsers = userRepository.findBySessionId(session.getId());

        if (existingUsers.size() >= session.getMaxUsers()) {
            throw new SessionFullException("Session is full (max limit: " + session.getMaxUsers() + ")");
        }

        boolean nameExists = existingUsers.stream()
                .anyMatch(u -> u.getDisplayName().equalsIgnoreCase(request.getDisplayName().trim()));
        if (nameExists) {
            throw new DuplicateDisplayNameException("Display name '" + request.getDisplayName() + "' is already taken in this session");
        }

        User newUser = User.builder()
                .session(session)
                .displayName(request.getDisplayName().trim())
                .build();
        userRepository.save(newUser);

        List<User> updatedUsers = userRepository.findBySessionId(session.getId());
        return SessionResponse.fromEntity(session, updatedUsers);
    }

    @Override
    @Transactional
    public SessionResponse updateSessionStatus(String roomCode, UpdateSessionStatusRequest request) {
        Session session = findSessionByRoomCodeOrThrow(roomCode);
        session.setStatus(request.getStatus());
        Session updatedSession = sessionRepository.save(session);

        List<User> users = userRepository.findBySessionId(updatedSession.getId());
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

        // Disassociate user from movie suggestions to preserve pool data
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

        return LeaveSessionResponse.builder()
                .sessionId(session.getId())
                .roomCode(session.getRoomCode())
                .hostName(session.getHostName())
                .status(session.getStatus())
                .remainingUserCount(remainingUsers.size())
                .remainingUsers(userResponses)
                .message(message)
                .build();
    }

    @Override
    @Transactional
    public LeaveSessionResponse leaveSessionByRoomCode(String roomCode, LeaveSessionRequest request) {
        Session session = findSessionByRoomCodeOrThrow(roomCode);
        return leaveSession(session.getId(), request);
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
