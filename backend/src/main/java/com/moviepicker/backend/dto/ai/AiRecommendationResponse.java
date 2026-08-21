package com.moviepicker.backend.dto.ai;

import com.moviepicker.backend.dto.MovieDto;
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
public class AiRecommendationResponse {
    private String prompt;
    private String replyMessage;

    @Builder.Default
    private List<MovieDto> movies = new ArrayList<>();

    private String modelUsed;
    private boolean cached;
}
