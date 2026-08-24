package com.moviepicker.backend.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class WebSocketPresenceService {

    // Key: "ROOMCODE:userId", Value: number of active websocket connections
    private final ConcurrentMap<String, Integer> activeConnections = new ConcurrentHashMap<>();

    private String buildKey(String roomCode, Long userId) {
        return roomCode.trim().toUpperCase() + ":" + userId;
    }

    public void userConnected(String roomCode, Long userId) {
        if (roomCode == null || userId == null) return;
        activeConnections.merge(buildKey(roomCode, userId), 1, Integer::sum);
    }

    public void userDisconnected(String roomCode, Long userId) {
        if (roomCode == null || userId == null) return;
        activeConnections.computeIfPresent(buildKey(roomCode, userId), (k, count) -> count > 1 ? count - 1 : null);
    }

    public boolean isUserConnected(String roomCode, Long userId) {
        if (roomCode == null || userId == null) return false;
        return activeConnections.getOrDefault(buildKey(roomCode, userId), 0) > 0;
    }
}
