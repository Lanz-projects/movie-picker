package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVotingProgressDto {

    private Long userId;
    private String displayName;
    private long votedCount;
    private boolean completed;
}
