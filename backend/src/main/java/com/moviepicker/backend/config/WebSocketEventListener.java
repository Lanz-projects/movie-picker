package com.moviepicker.backend.config;

import com.moviepicker.backend.dto.LeaveSessionRequest;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SessionService sessionService;

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes == null) {
            return;
        }

        String roomCode = (String) sessionAttributes.get("roomCode");
        Long userId = (Long) sessionAttributes.get("userId");
        String displayName = (String) sessionAttributes.get("displayName");

        if (roomCode != null && userId != null) {
            log.info("WebSocket disconnected for user '{}' (id={}) in room '{}'. Cleaning up session presence...",
                    displayName, userId, roomCode);
            try {
                sessionService.leaveSessionByRoomCode(roomCode, LeaveSessionRequest.builder().userId(userId).build());
            } catch (ResourceNotFoundException e) {
                // User or session already removed (e.g. via explicit REST leave endpoint)
                log.debug("Session or user already cleaned up on disconnect: {}", e.getMessage());
            } catch (Exception e) {
                log.warn("Error cleaning up user on WebSocket disconnect: {}", e.getMessage());
            }
        }
    }
}
