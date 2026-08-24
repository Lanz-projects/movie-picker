package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.UserPresenceDto;
import com.moviepicker.backend.service.WebSocketPresenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketPresenceController {

    private final WebSocketPresenceService presenceService;

    @MessageMapping("/room/register")
    public void registerPresence(@Valid @Payload UserPresenceDto presence, SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("roomCode", presence.getRoomCode().trim());
            sessionAttributes.put("userId", presence.getUserId());
            sessionAttributes.put("displayName", presence.getDisplayName().trim());

            presenceService.userConnected(presence.getRoomCode(), presence.getUserId());

            log.info("Registered WebSocket presence: user '{}' (id={}) in room '{}' (sessionId={})",
                    presence.getDisplayName(), presence.getUserId(), presence.getRoomCode(), headerAccessor.getSessionId());
        }
    }
}
