package com.moviepicker.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreamingProviderDto implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long providerId;
    private String providerName;
    private String logoPath;
    private String type; // "flatrate" (stream), "rent", "buy"
}
