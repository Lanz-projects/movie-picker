package com.moviepicker.backend.dto;

import com.moviepicker.backend.model.VoteType;
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
public class VoteMessageDto {

    @NotBlank(message = "Room code is required")
    private String roomCode;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Movie suggestion ID is required")
    private Long movieSuggestionId;

    @NotNull(message = "Vote type is required")
    private VoteType voteType;
}
