package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResponse {
    private Long id;
    private String roomCode;
    private String hostName;
    private Integer maxUsers;
    private Integer maxSuggestionsPerUser;
    private SessionStatus status;
    private LocalDateTime createdAt;
    private String currentSessionToken;
    @Builder.Default
    private List<UserResponse> users = new ArrayList<>();

    public static SessionResponse fromEntity(Session session, List<User> userEntities) {
        if (session == null) return null;
        List<UserResponse> userResponses = (userEntities != null)
                ? userEntities.stream().map(UserResponse::fromEntity).collect(Collectors.toList())
                : new ArrayList<>();

        return SessionResponse.builder()
                .id(session.getId())
                .roomCode(session.getRoomCode())
                .hostName(session.getHostName())
                .maxUsers(session.getMaxUsers())
                .maxSuggestionsPerUser(session.getMaxSuggestionsPerUser())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .users(userResponses)
                .build();
    }
}
