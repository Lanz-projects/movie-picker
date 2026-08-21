package com.moviepicker.backend.security.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.moviepicker.backend.config.RateLimitProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;

@Slf4j
@Service
public class RateLimiterService {

    private final RateLimitProperties properties;
    private final Cache<String, TokenBucket> bucketCache;

    public RateLimiterService(RateLimitProperties properties) {
        this.properties = properties;
        this.bucketCache = Caffeine.newBuilder()
                .maximumSize(100_000)
                .expireAfterAccess(Duration.ofMinutes(10))
                .build();
    }

    public RateLimitResult checkRateLimit(HttpServletRequest request) {
        if (!properties.isEnabled()) {
            return RateLimitResult.allowed(1000, 1000, 0);
        }

        String ip = resolveClientIp(request);
        String uri = request.getRequestURI();
        String method = request.getMethod();

        EndpointCategory category = resolveCategory(uri, method);
        int limit = getLimitForCategory(category);

        String cacheKey = ip + ":" + category.name();
        TokenBucket bucket = bucketCache.get(cacheKey, k -> new TokenBucket(limit, properties.getWindowSeconds()));

        return bucket.tryConsume(1);
    }

    public String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            String firstIp = xForwardedFor.split(",")[0].trim();
            if (StringUtils.hasText(firstIp) && !"unknown".equalsIgnoreCase(firstIp)) {
                return firstIp;
            }
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(xRealIp) && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp.trim();
        }

        String remoteAddr = request.getRemoteAddr();
        if ("0:0:0:0:0:0:0:1".equals(remoteAddr)) {
            return "127.0.0.1";
        }
        return StringUtils.hasText(remoteAddr) ? remoteAddr : "unknown";
    }

    public EndpointCategory resolveCategory(String uri, String method) {
        if (uri == null) {
            return EndpointCategory.DEFAULT;
        }

        String normalizedUri = uri.toLowerCase();
        // Room Creation: POST /api/v1/sessions or POST /api/sessions
        if ("POST".equalsIgnoreCase(method) &&
                (normalizedUri.equals("/api/v1/sessions") || normalizedUri.equals("/api/v1/sessions/") ||
                 normalizedUri.equals("/api/sessions") || normalizedUri.equals("/api/sessions/"))) {
            return EndpointCategory.CREATE_SESSION;
        }

        // Room Join: POST /api/v1/sessions/join or POST /api/sessions/join
        if ("POST".equalsIgnoreCase(method) &&
                (normalizedUri.startsWith("/api/v1/sessions/join") || normalizedUri.startsWith("/api/sessions/join"))) {
            return EndpointCategory.JOIN_SESSION;
        }

        // Movie Search & Discover: GET /api/v1/movies/* or GET /api/movies/*
        if ("GET".equalsIgnoreCase(method) &&
                (normalizedUri.startsWith("/api/v1/movies") || normalizedUri.startsWith("/api/movies"))) {
            return EndpointCategory.MOVIE_SEARCH;
        }

        // Session Actions: /api/v1/sessions/* or /api/sessions/*
        if (normalizedUri.startsWith("/api/v1/sessions") || normalizedUri.startsWith("/api/sessions")) {
            return EndpointCategory.SESSION_ACTION;
        }

        return EndpointCategory.DEFAULT;
    }

    public int getLimitForCategory(EndpointCategory category) {
        return switch (category) {
            case CREATE_SESSION -> properties.getCreateSessionLimit();
            case JOIN_SESSION -> properties.getJoinSessionLimit();
            case MOVIE_SEARCH -> properties.getMovieSearchLimit();
            case SESSION_ACTION -> properties.getSessionActionLimit();
            case DEFAULT -> properties.getDefaultLimit();
        };
    }

    public void clearCache() {
        bucketCache.invalidateAll();
    }
}
