package com.moviepicker.backend.security.ratelimit;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class TokenBucketTest {

    @Test
    public void testTokenBucket_AllowsUpToCapacity() {
        TokenBucket bucket = new TokenBucket(5, 60);

        for (int i = 0; i < 5; i++) {
            RateLimitResult result = bucket.tryConsume(1);
            assertThat(result.isAllowed()).isTrue();
            assertThat(result.getRemaining()).isEqualTo(4 - i);
            assertThat(result.getLimit()).isEqualTo(5);
        }

        // 6th attempt should be rejected
        RateLimitResult rejected = bucket.tryConsume(1);
        assertThat(rejected.isAllowed()).isFalse();
        assertThat(rejected.getRemaining()).isEqualTo(0);
        assertThat(rejected.getRetryAfterSeconds()).isGreaterThan(0);
    }

    @Test
    public void testTokenBucket_RefillsOverTime() throws InterruptedException {
        // 2 tokens per 1 second (1000ms)
        TokenBucket bucket = new TokenBucket(2, 1);

        assertThat(bucket.tryConsume(1).isAllowed()).isTrue();
        assertThat(bucket.tryConsume(1).isAllowed()).isTrue();
        assertThat(bucket.tryConsume(1).isAllowed()).isFalse();

        // Wait for refill (1000ms for full capacity)
        Thread.sleep(1050);

        assertThat(bucket.tryConsume(1).isAllowed()).isTrue();
    }
}
