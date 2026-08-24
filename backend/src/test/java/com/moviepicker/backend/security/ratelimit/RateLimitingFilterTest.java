package com.moviepicker.backend.security.ratelimit;

import com.moviepicker.backend.config.RateLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

public class RateLimitingFilterTest {

    private RateLimitProperties properties;
    private RateLimiterService service;
    private RateLimitingFilter filter;

    @BeforeEach
    public void setUp() {
        properties = new RateLimitProperties();
        properties.setEnabled(true);
        properties.setCreateSessionLimit(2);
        properties.setWindowSeconds(60);

        service = new RateLimiterService(properties);
        filter = new RateLimitingFilter(service, properties);
    }

    @Test
    public void testFilter_PassesUnderLimit_AndSetsHeaders() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/sessions");
        request.setRemoteAddr("192.168.1.50");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = new MockFilterChain();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeader("X-RateLimit-Limit")).isEqualTo("2");
        assertThat(response.getHeader("X-RateLimit-Remaining")).isEqualTo("1");
        assertThat(response.getHeader("X-RateLimit-Reset")).isEqualTo("60");
    }

    @Test
    public void testFilter_Returns429WhenLimitExceeded() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/sessions");
        request.setRemoteAddr("192.168.1.51");

        // 1st request
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        // 2nd request
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        // 3rd request (exceeds limit 2)
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isNotNull();
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString()).contains("Rate limit exceeded");
    }

    @Test
    public void testFilter_BypassesNonApiRoutes() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/ws/info");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = new MockFilterChain();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeader("X-RateLimit-Limit")).isNull();
    }
}
