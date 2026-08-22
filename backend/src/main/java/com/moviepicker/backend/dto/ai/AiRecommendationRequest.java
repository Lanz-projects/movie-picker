package com.moviepicker.backend.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationRequest {

    @NotBlank(message = "Prompt must not be blank")
    @Size(max = 500, message = "Prompt must not exceed 500 characters")
    private String prompt;

    @Builder.Default
    private List<@Valid AiChatMessage> conversationHistory = new ArrayList<>();

    @Builder.Default
    private Set<Long> excludedTmdbIds = new HashSet<>();

    @Builder.Default
    @Min(value = 1, message = "Page must be at least 1")
    private int page = 1;

    @Builder.Default
    @Min(value = 1, message = "Limit must be at least 1")
    @Max(value = 10, message = "Limit must not exceed 10")
    private int limit = 5;
}
