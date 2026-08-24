package com.moviepicker.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class CreateSessionRequest {

    @NotBlank(message = "Host name cannot be blank")
    @Size(max = 100, message = "Host name must be at most 100 characters")
    private String hostName;

    @Builder.Default
    @Min(value = 2, message = "maxUsers must be at least 2")
    @Max(value = 20, message = "maxUsers cannot exceed 20")
    private Integer maxUsers = 10;

    @Builder.Default
    @Min(value = 1, message = "maxSuggestionsPerUser must be at least 1")
    @Max(value = 10, message = "maxSuggestionsPerUser cannot exceed 10")
    private Integer maxSuggestionsPerUser = 5;
}
