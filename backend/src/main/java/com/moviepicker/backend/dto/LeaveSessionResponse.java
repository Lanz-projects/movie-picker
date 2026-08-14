package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveSessionResponse {

    private Long sessionId;
    private String roomCode;
    private String hostName;
    private SessionStatus status;
    private int remainingUserCount;
    private String message;
    @Builder.Default
    private List<UserResponse> remainingUsers = new ArrayList<>();
}
