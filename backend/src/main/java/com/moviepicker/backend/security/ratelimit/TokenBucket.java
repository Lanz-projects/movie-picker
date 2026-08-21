package com.moviepicker.backend.security.ratelimit;

import lombok.Getter;

public class TokenBucket {

    @Getter
    private final int capacity;
    private final double refillRatePerMillis;
    private double availableTokens;
    private long lastRefillTimeMillis;

    public TokenBucket(int capacity, int windowSeconds) {
        this.capacity = capacity;
        long windowMillis = Math.max(1, (long) windowSeconds * 1000L);
        this.refillRatePerMillis = (double) capacity / windowMillis;
        this.availableTokens = capacity;
        this.lastRefillTimeMillis = System.currentTimeMillis();
    }

    public synchronized RateLimitResult tryConsume(int tokensToConsume) {
        long now = System.currentTimeMillis();
        long elapsedMillis = Math.max(0, now - lastRefillTimeMillis);
        lastRefillTimeMillis = now;

        double refilledTokens = elapsedMillis * refillRatePerMillis;
        availableTokens = Math.min((double) capacity, availableTokens + refilledTokens);

        if (availableTokens >= tokensToConsume) {
            availableTokens -= tokensToConsume;
            int remaining = (int) Math.floor(availableTokens);
            return RateLimitResult.allowed(capacity, remaining, 0);
        } else {
            double deficit = tokensToConsume - availableTokens;
            long retryAfterSeconds = Math.max(1, (long) Math.ceil((deficit / refillRatePerMillis) / 1000.0));
            return RateLimitResult.rejected(capacity, 0, retryAfterSeconds);
        }
    }
}
