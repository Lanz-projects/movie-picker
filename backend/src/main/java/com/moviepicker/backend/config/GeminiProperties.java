package com.moviepicker.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "gemini.api")
public class GeminiProperties {
    private String key;
    private String model = "gemini-3.5-flash-lite";
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    private Double temperature = 0.7;
    private String systemInstructionPath = "classpath:prompts/gemini-system-instruction.txt";
    private int fetchTarget = 8;
    private int cacheTtlMinutes = 15;
    private int timeoutSeconds = 30;
}
