package com.moviepicker.backend.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TmdbMovieDetailsResponse {

    private Long id;
    private String title;
    private String tagline;
    private String overview;

    @JsonProperty("poster_path")
    private String posterPath;

    @JsonProperty("backdrop_path")
    private String backdropPath;

    @JsonProperty("release_date")
    private String releaseDate;

    private Integer runtime;

    @JsonProperty("vote_average")
    private Double voteAverage;

    @JsonProperty("vote_count")
    private Integer voteCount;

    private Double popularity;

    @JsonProperty("original_language")
    private String originalLanguage;

    private List<TmdbGenreDto> genres;

    private TmdbCreditsDto credits;

    @JsonProperty("watch/providers")
    private TmdbWatchProvidersResponse watchProviders;

    @JsonProperty("release_dates")
    private TmdbReleaseDatesResponse releaseDates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbGenreDto {
        private Integer id;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbCreditsDto {
        private List<TmdbCastMemberDto> cast;
        private List<TmdbCrewMemberDto> crew;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbCastMemberDto {
        private Long id;
        private String name;
        private String character;
        private Integer order;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbCrewMemberDto {
        private Long id;
        private String name;
        private String job;
        private String department;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbWatchProvidersResponse {
        private Map<String, TmdbCountryWatchProvidersDto> results;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbCountryWatchProvidersDto {
        private String link;
        private List<TmdbProviderItemDto> flatrate;
        private List<TmdbProviderItemDto> rent;
        private List<TmdbProviderItemDto> buy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbProviderItemDto {
        @JsonProperty("provider_id")
        private Long providerId;

        @JsonProperty("provider_name")
        private String providerName;

        @JsonProperty("logo_path")
        private String logoPath;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbReleaseDatesResponse {
        private List<TmdbCountryReleaseDatesDto> results;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbCountryReleaseDatesDto {
        @JsonProperty("iso_3166_1")
        private String countryCode;

        @JsonProperty("release_dates")
        private List<TmdbReleaseDateItemDto> releaseDates;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TmdbReleaseDateItemDto {
        private String certification;
        private Integer type;
    }
}
