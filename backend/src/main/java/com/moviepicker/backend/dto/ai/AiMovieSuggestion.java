package com.moviepicker.backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMovieSuggestion {
    private String title;
    private Integer year;
    private String vibeMatch;
}
