package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.SessionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSessionStatusRequest {

    @NotNull(message = "Status cannot be null")
    private SessionStatus status;
}
