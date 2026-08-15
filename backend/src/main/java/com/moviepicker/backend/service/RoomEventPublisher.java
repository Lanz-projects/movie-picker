package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.LeaveSessionResponse;
import com.moviepicker.backend.dto.RoomProgressEvent;
import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.dto.UserResponse;
import com.moviepicker.backend.model.SessionStatus;

import java.util.List;

public interface RoomEventPublisher {

    void publishUserJoined(String roomCode, Long userId, String displayName, String hostName, List<UserResponse> users);

    void publishUserLeft(String roomCode, LeaveSessionResponse leaveResponse);

    void publishStageChanged(String roomCode, SessionStatus newStatus, List<UserResponse> users);

    void publishDeckSubmitted(String roomCode, Long userId, String userDisplayName, int submittedCount, int totalUsers);

    void publishVoteProgress(String roomCode, RoomProgressEvent voteEvent);

    void publishResults(String roomCode, SessionResultsResponse results);
}
