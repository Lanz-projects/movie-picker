package com.moviepicker.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.rate-limiting")
@Data
public class RateLimitProperties {

    private boolean enabled = true;
    private int createSessionLimit = 5;       // 5 requests per minute
    private int joinSessionLimit = 15;        // 15 requests per minute
    private int movieSearchLimit = 40;        // 40 requests per minute
    private int sessionActionLimit = 120;     // 120 requests per minute
    private int defaultLimit = 120;           // 120 requests per minute
    private int windowSeconds = 60;           // 60-second window
}
