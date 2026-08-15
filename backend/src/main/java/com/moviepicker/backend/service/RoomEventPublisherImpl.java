package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.model.SessionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomEventPublisherImpl implements RoomEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    private static final String ROOM_TOPIC_PREFIX = "/topic/room/";

    @Override
    public void publishUserJoined(String roomCode, Long userId, String displayName, String hostName, List<UserResponse> users) {
        String cleanCode = roomCode.trim();
        RoomProgressEvent event = RoomProgressEvent.builder()
                .eventType(RoomEventType.USER_JOINED)
                .roomCode(cleanCode)
                .userId(userId)
                .userDisplayName(displayName)
                .hostName(hostName)
                .sessionStatus(SessionStatus.WAITING)
                .users(users)
                .message(displayName + " joined the room.")
                .build();

        sendToRoom(cleanCode, event);
    }

    @Override
    public void publishUserLeft(String roomCode, LeaveSessionResponse leaveResponse) {
        String cleanCode = roomCode.trim();
        RoomEventType eventType = RoomEventType.USER_LEFT;

        RoomProgressEvent event = RoomProgressEvent.builder()
                .eventType(eventType)
                .roomCode(cleanCode)
                .hostName(leaveResponse.getHostName())
                .sessionStatus(leaveResponse.getStatus())
                .users(leaveResponse.getRemainingUsers())
                .message(leaveResponse.getMessage())
                .build();

        sendToRoom(cleanCode, event);
    }

    @Override
    public void publishStageChanged(String roomCode, SessionStatus newStatus, List<UserResponse> users) {
        String cleanCode = roomCode.trim();
        RoomProgressEvent event = RoomProgressEvent.builder()
                .eventType(RoomEventType.STAGE_CHANGED)
                .roomCode(cleanCode)
                .sessionStatus(newStatus)
                .users(users)
                .message("Session stage advanced to " + newStatus)
                .build();

        sendToRoom(cleanCode, event);
    }

    @Override
    public void publishDeckSubmitted(String roomCode, Long userId, String userDisplayName, int submittedCount, int totalUsers) {
        String cleanCode = roomCode.trim();
        RoomProgressEvent event = RoomProgressEvent.builder()
                .eventType(RoomEventType.DECK_SUBMITTED)
                .roomCode(cleanCode)
                .userId(userId)
                .userDisplayName(userDisplayName)
                .submittedUserCount(submittedCount)
                .totalUserCount(totalUsers)
                .message(userDisplayName + " submitted their movie deck.")
                .build();

        sendToRoom(cleanCode, event);
    }

    @Override
    public void publishVoteProgress(String roomCode, RoomProgressEvent voteEvent) {
        sendToRoom(roomCode.trim(), voteEvent);
    }

    @Override
    public void publishResults(String roomCode, SessionResultsResponse results) {
        String destination = ROOM_TOPIC_PREFIX + roomCode.trim() + "/results";
        messagingTemplate.convertAndSend(destination, results);
        log.info("Broadcasted winning results to destination='{}' (Winner: '{}')",
                destination, results.getWinner() != null ? results.getWinner().getTitle() : "None");
    }

    private void sendToRoom(String roomCode, Object payload) {
        String destination = ROOM_TOPIC_PREFIX + roomCode;
        messagingTemplate.convertAndSend(destination, payload);
        log.info("Broadcasted room event to destination='{}': {}", destination, payload);
    }
}
