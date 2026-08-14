package com.moviepicker.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitMoviesRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(message = "Movie submission list must not be empty")
    @Valid
    private List<MovieSubmissionDto> movies;
}
