package com.moviepicker.backend.security.ratelimit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateLimitResult {
    private boolean allowed;
    private int limit;
    private int remaining;
    private long retryAfterSeconds;

    public static RateLimitResult allowed(int limit, int remaining, long retryAfterSeconds) {
        return RateLimitResult.builder()
                .allowed(true)
                .limit(limit)
                .remaining(remaining)
                .retryAfterSeconds(retryAfterSeconds)
                .build();
    }

    public static RateLimitResult rejected(int limit, int remaining, long retryAfterSeconds) {
        return RateLimitResult.builder()
                .allowed(false)
                .limit(limit)
                .remaining(remaining)
                .retryAfterSeconds(retryAfterSeconds)
                .build();
    }
}
