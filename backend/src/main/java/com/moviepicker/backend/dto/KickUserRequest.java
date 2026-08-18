package com.moviepicker.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KickUserRequest {

    @NotNull(message = "Host user ID is required")
    private Long hostUserId;

    @NotNull(message = "Target user ID is required")
    private Long targetUserId;

    private Boolean banPermanently;
}
