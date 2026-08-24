package com.moviepicker.backend.config;

import com.moviepicker.backend.security.ratelimit.RateLimiterService;
import com.moviepicker.backend.security.ratelimit.RateLimitingFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class RateLimitingConfig {

    @Bean
    @ConditionalOnProperty(name = "app.rate-limiting.enabled", havingValue = "true", matchIfMissing = true)
    public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilterRegistration(
            RateLimiterService rateLimiterService,
            RateLimitProperties properties) {

        FilterRegistrationBean<RateLimitingFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new RateLimitingFilter(rateLimiterService, properties));
        registrationBean.addUrlPatterns("/api/*", "/api/v1/*");
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE + 50);
        return registrationBean;
    }
}
