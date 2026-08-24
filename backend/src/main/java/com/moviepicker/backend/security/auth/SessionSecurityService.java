package com.moviepicker.backend.security.auth;

import com.moviepicker.backend.exception.ForbiddenException;
import com.moviepicker.backend.exception.UnauthorizedException;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionSecurityService {

    private final UserRepository userRepository;

    /**
     * Validates that the provided sessionToken belongs to the user with id userId in the room.
     */
    public User validateUserToken(String roomCode, Long userId, String sessionToken) {
        if (!StringUtils.hasText(sessionToken)) {
            throw new UnauthorizedException("Missing authentication token (X-Session-Token header required)");
        }

        User user = userRepository.findBySessionTokenWithSession(sessionToken.trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid session authentication token"));

        if (roomCode != null && !user.getSession().getRoomCode().equalsIgnoreCase(roomCode.trim())) {
            throw new ForbiddenException("Authentication token does not match the requested room");
        }

        if (userId != null && !user.getId().equals(userId)) {
            throw new ForbiddenException("Authentication token does not match the requested user identity");
        }

        return user;
    }

    /**
     * Validates that the provided sessionToken belongs to the user with id userId by session ID.
     */
    public User validateUserTokenBySessionId(Long sessionId, Long userId, String sessionToken) {
        if (!StringUtils.hasText(sessionToken)) {
            throw new UnauthorizedException("Missing authentication token (X-Session-Token header required)");
        }

        User user = userRepository.findBySessionTokenWithSession(sessionToken.trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid session authentication token"));

        if (sessionId != null && !user.getSession().getId().equals(sessionId)) {
            throw new ForbiddenException("Authentication token does not match the requested session");
        }

        if (userId != null && !user.getId().equals(userId)) {
            throw new ForbiddenException("Authentication token does not match the requested user identity");
        }

        return user;
    }

    /**
     * Validates that the provided sessionToken belongs to the active HOST of the room.
     */
    public User validateHostToken(String roomCode, String sessionToken) {
        if (!StringUtils.hasText(sessionToken)) {
            throw new UnauthorizedException("Missing authentication token (X-Session-Token header required)");
        }

        User user = userRepository.findBySessionTokenWithSession(sessionToken.trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid session authentication token"));

        Session session = user.getSession();
        if (roomCode != null && !session.getRoomCode().equalsIgnoreCase(roomCode.trim())) {
            throw new ForbiddenException("Authentication token does not belong to the requested room");
        }

        if (!session.getHostName().equalsIgnoreCase(user.getDisplayName().trim())) {
            throw new ForbiddenException("Only the room host is authorized to perform this action");
        }

        return user;
    }

    /**
     * Validates that the provided sessionToken belongs to the active HOST by session ID.
     */
    public User validateHostTokenBySessionId(Long sessionId, String sessionToken) {
        if (!StringUtils.hasText(sessionToken)) {
            throw new UnauthorizedException("Missing authentication token (X-Session-Token header required)");
        }

        User user = userRepository.findBySessionTokenWithSession(sessionToken.trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid session authentication token"));

        Session session = user.getSession();
        if (sessionId != null && !session.getId().equals(sessionId)) {
            throw new ForbiddenException("Authentication token does not belong to the requested session");
        }

        if (!session.getHostName().equalsIgnoreCase(user.getDisplayName().trim())) {
            throw new ForbiddenException("Only the room host is authorized to perform this action");
        }

        return user;
    }
}
