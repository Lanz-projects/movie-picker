package com.moviepicker.backend.config;

import com.moviepicker.backend.dto.LeaveSessionRequest;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.service.SessionService;
import com.moviepicker.backend.service.WebSocketPresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SessionService sessionService;
    private final WebSocketPresenceService presenceService;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private static final long RECONNECT_GRACE_PERIOD_SECONDS = 5;

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
            presenceService.userDisconnected(roomCode, userId);

            log.info("WebSocket disconnected for user '{}' (id={}) in room '{}'. Starting {}s reconnect grace period...",
                    displayName, userId, roomCode, RECONNECT_GRACE_PERIOD_SECONDS);

            scheduler.schedule(() -> {
                try {
                    if (!presenceService.isUserConnected(roomCode, userId)) {
                        log.info("User '{}' (id={}) did not reconnect within grace period. Removing from room '{}'...",
                                displayName, userId, roomCode);
                        sessionService.leaveSessionByRoomCode(
                                roomCode,
                                LeaveSessionRequest.builder().userId(userId).build()
                        );
                    } else {
                        log.info("User '{}' (id={}) reconnected to room '{}' successfully. Session preserved.",
                                displayName, userId, roomCode);
                    }
                } catch (ResourceNotFoundException e) {
                    log.debug("Session or user already removed: {}", e.getMessage());
                } catch (Exception e) {
                    log.warn("Error cleaning up departed user on grace period expiry: {}", e.getMessage());
                }
            }, RECONNECT_GRACE_PERIOD_SECONDS, TimeUnit.SECONDS);
        }
    }
}
