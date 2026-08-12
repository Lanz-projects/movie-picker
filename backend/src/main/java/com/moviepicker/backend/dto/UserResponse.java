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

    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .joinedAt(user.getJoinedAt())
                .build();
    }
}
