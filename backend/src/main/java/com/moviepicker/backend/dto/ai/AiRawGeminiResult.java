package com.moviepicker.backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRawGeminiResult {
    private String replyMessage;

    @Builder.Default
    private List<AiMovieSuggestion> suggestions = new ArrayList<>();
}
