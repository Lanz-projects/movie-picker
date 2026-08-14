package com.moviepicker.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "tmdb.api")
@Data
public class TmdbProperties {

    private String baseUrl = "https://api.themoviedb.org/3";
    private String accessToken;
    private String key;
}
