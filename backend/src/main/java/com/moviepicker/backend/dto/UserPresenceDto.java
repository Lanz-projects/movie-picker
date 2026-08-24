package com.moviepicker.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPresenceDto {

    @NotBlank(message = "Room code is required")
    private String roomCode;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Display name is required")
    private String displayName;
}
