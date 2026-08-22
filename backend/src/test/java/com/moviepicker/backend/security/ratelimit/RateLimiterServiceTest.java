package com.moviepicker.backend.security.ratelimit;

import com.moviepicker.backend.config.RateLimitProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

public class RateLimiterServiceTest {

    private RateLimitProperties properties;
    private RateLimiterService service;

    @BeforeEach
    public void setUp() {
        properties = new RateLimitProperties();
        properties.setEnabled(true);
        properties.setCreateSessionLimit(3);
        properties.setJoinSessionLimit(5);
        properties.setMovieSearchLimit(10);
        properties.setSessionActionLimit(20);
        properties.setAiRecommendationLimit(2);
        properties.setDefaultLimit(20);
        properties.setWindowSeconds(60);

        service = new RateLimiterService(properties);
    }

    @Test
    public void testResolveClientIp_FromXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.195, 70.41.3.18, 150.172.238.178");

        String ip = service.resolveClientIp(request);
        assertThat(ip).isEqualTo("203.0.113.195");
    }

    @Test
    public void testResolveClientIp_FromXRealIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Real-IP", "198.51.100.42");

        String ip = service.resolveClientIp(request);
        assertThat(ip).isEqualTo("198.51.100.42");
    }

    @Test
    public void testResolveCategory() {
        assertThat(service.resolveCategory("/api/v1/sessions", "POST"))
                .isEqualTo(EndpointCategory.CREATE_SESSION);
        assertThat(service.resolveCategory("/api/sessions", "POST"))
                .isEqualTo(EndpointCategory.CREATE_SESSION);

        assertThat(service.resolveCategory("/api/v1/sessions/join", "POST"))
                .isEqualTo(EndpointCategory.JOIN_SESSION);

        assertThat(service.resolveCategory("/api/v1/movies/search", "GET"))
                .isEqualTo(EndpointCategory.MOVIE_SEARCH);

        assertThat(service.resolveCategory("/api/v1/sessions/ABCD/movies", "POST"))
                .isEqualTo(EndpointCategory.SESSION_ACTION);

        assertThat(service.resolveCategory("/api/v1/sessions/ABCD/ai/recommendations", "POST"))
                .isEqualTo(EndpointCategory.AI_RECOMMENDATION);

        assertThat(service.resolveCategory("/api/v1/ai/recommendations", "POST"))
                .isEqualTo(EndpointCategory.AI_RECOMMENDATION);
    }

    @Test
    public void testCheckRateLimit_EnforcesPerEndpointCategoryLimits() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/sessions");
        request.setRemoteAddr("10.0.0.1");

        // 3 requests allowed for CREATE_SESSION
        assertThat(service.checkRateLimit(request).isAllowed()).isTrue();
        assertThat(service.checkRateLimit(request).isAllowed()).isTrue();
        assertThat(service.checkRateLimit(request).isAllowed()).isTrue();

        // 4th request rejected
        RateLimitResult result = service.checkRateLimit(request);
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getRetryAfterSeconds()).isGreaterThan(0);
    }

    @Test
    public void testCheckRateLimit_AiRecommendationLimitEnforced() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/sessions/VIBE12/ai/recommendations");
        request.setRemoteAddr("10.0.0.99");

        // 2 requests allowed for AI_RECOMMENDATION
        assertThat(service.checkRateLimit(request).isAllowed()).isTrue();
        assertThat(service.checkRateLimit(request).isAllowed()).isTrue();

        // 3rd request rejected
        RateLimitResult result = service.checkRateLimit(request);
        assertThat(result.isAllowed()).isFalse();
        assertThat(result.getRetryAfterSeconds()).isGreaterThan(0);
    }

    @Test
    public void testCheckRateLimit_WhenDisabled_AlwaysAllows() {
        properties.setEnabled(false);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/sessions");
        request.setRemoteAddr("10.0.0.2");

        for (int i = 0; i < 20; i++) {
            assertThat(service.checkRateLimit(request).isAllowed()).isTrue();
        }
    }
}
