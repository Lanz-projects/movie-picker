package com.moviepicker.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinSessionRequest {

    @NotBlank(message = "Room code cannot be blank")
    @Size(min = 6, max = 6, message = "Room code must be 6 characters")
    private String roomCode;

    @NotBlank(message = "Display name cannot be blank")
    @Size(max = 100, message = "Display name must be at most 100 characters")
    private String displayName;
}
