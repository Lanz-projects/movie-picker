package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String displayName;
    private LocalDateTime joinedAt;
    private Integer kickCount;

    public static UserResponse fromEntity(User user) {
        return fromEntity(user, 0);
    }

    public static UserResponse fromEntity(User user, Integer kickCount) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .joinedAt(user.getJoinedAt())
                .kickCount(kickCount != null ? kickCount : 0)
                .build();
    }
}
