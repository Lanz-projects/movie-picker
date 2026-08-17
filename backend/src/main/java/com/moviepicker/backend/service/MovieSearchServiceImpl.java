package com.moviepicker.backend.service;

import com.moviepicker.backend.client.TmdbClient;
import com.moviepicker.backend.dto.MovieDetailsDto;
import com.moviepicker.backend.dto.MovieDto;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.dto.StreamingProviderDto;
import com.moviepicker.backend.dto.tmdb.TmdbMovieDetailsResponse;
import com.moviepicker.backend.dto.tmdb.TmdbMovieDto;
import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovieSearchServiceImpl implements MovieSearchService {

    private final TmdbClient tmdbClient;

    private static final Map<Integer, String> TMDB_GENRE_MAP = Map.ofEntries(
            Map.entry(28, "Action"),
            Map.entry(12, "Adventure"),
            Map.entry(16, "Animation"),
            Map.entry(35, "Comedy"),
            Map.entry(80, "Crime"),
            Map.entry(99, "Documentary"),
            Map.entry(18, "Drama"),
            Map.entry(10751, "Family"),
            Map.entry(14, "Fantasy"),
            Map.entry(36, "History"),
            Map.entry(27, "Horror"),
            Map.entry(10402, "Music"),
            Map.entry(9648, "Mystery"),
            Map.entry(10749, "Romance"),
            Map.entry(878, "Sci-Fi"),
            Map.entry(10770, "TV Movie"),
            Map.entry(53, "Thriller"),
            Map.entry(10752, "War"),
            Map.entry(37, "Western")
    );

    @Override
    @Cacheable(value = "movieSearches", key = "#query.trim().toLowerCase() + '_' + #page")
    public MovieSearchResponse searchMovies(String query, int page) {
        log.info("Executing TMDB search for query='{}', page={}", query, page);

        if (!StringUtils.hasText(query)) {
            return MovieSearchResponse.builder()
                    .page(Math.max(1, page))
                    .totalPages(0)
                    .totalResults(0)
                    .movies(Collections.emptyList())
                    .build();
        }

        TmdbSearchResponse rawResponse = tmdbClient.searchMovies(query.trim(), page);

        if (rawResponse == null || rawResponse.getResults() == null) {
            return MovieSearchResponse.builder()
                    .page(Math.max(1, page))
                    .totalPages(0)
                    .totalResults(0)
                    .movies(Collections.emptyList())
                    .build();
        }

        List<MovieDto> movies = rawResponse.getResults().stream()
                .map(this::mapToMovieDto)
                .collect(Collectors.toList());

        return MovieSearchResponse.builder()
                .page(rawResponse.getPage() != null ? rawResponse.getPage() : Math.max(1, page))
                .totalPages(rawResponse.getTotalPages() != null ? rawResponse.getTotalPages() : 0)
                .totalResults(rawResponse.getTotalResults() != null ? rawResponse.getTotalResults() : 0)
                .movies(movies)
                .build();
    }

    @Override
    @Cacheable(value = "movieDetails", key = "#tmdbId")
    public MovieDetailsDto getMovieDetails(Long tmdbId) {
        log.info("Fetching rich TMDB details for movie id={}", tmdbId);
        if (tmdbId == null) {
            return null;
        }

        TmdbMovieDetailsResponse raw = tmdbClient.getMovieDetails(tmdbId);
        if (raw == null) {
            return null;
        }

        return mapToMovieDetailsDto(raw);
    }

    private MovieDto mapToMovieDto(TmdbMovieDto dto) {
        List<String> genres = dto.getGenreIds() != null
                ? dto.getGenreIds().stream()
                    .map(id -> TMDB_GENRE_MAP.getOrDefault(id, "Other"))
                    .filter(g -> !"Other".equals(g))
                    .collect(Collectors.toList())
                : Collections.emptyList();

        return MovieDto.builder()
                .tmdbId(dto.getId())
                .title(dto.getTitle())
                .overview(dto.getOverview())
                .posterPath(dto.getPosterPath())
                .backdropPath(dto.getBackdropPath())
                .releaseYear(extractReleaseYear(dto.getReleaseDate()))
                .releaseDate(dto.getReleaseDate())
                .voteAverage(dto.getVoteAverage())
                .voteCount(dto.getVoteCount())
                .popularity(dto.getPopularity())
                .originalLanguage(dto.getOriginalLanguage())
                .genres(genres)
                .build();
    }

    private MovieDetailsDto mapToMovieDetailsDto(TmdbMovieDetailsResponse raw) {
        // 1. Genres
        List<String> genres = raw.getGenres() != null
                ? raw.getGenres().stream()
                    .map(TmdbMovieDetailsResponse.TmdbGenreDto::getName)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.toList())
                : Collections.emptyList();

        // 2. Directors
        List<String> directors = Collections.emptyList();
        List<String> topCast = Collections.emptyList();
        if (raw.getCredits() != null) {
            if (raw.getCredits().getCrew() != null) {
                directors = raw.getCredits().getCrew().stream()
                        .filter(crew -> "Director".equalsIgnoreCase(crew.getJob()))
                        .map(TmdbMovieDetailsResponse.TmdbCrewMemberDto::getName)
                        .distinct()
                        .collect(Collectors.toList());
            }
            if (raw.getCredits().getCast() != null) {
                topCast = raw.getCredits().getCast().stream()
                        .map(TmdbMovieDetailsResponse.TmdbCastMemberDto::getName)
                        .filter(StringUtils::hasText)
                        .limit(15)
                        .collect(Collectors.toList());
            }
        }

        // 3. Content Rating (e.g. PG-13, R)
        String contentRating = null;
        if (raw.getReleaseDates() != null && raw.getReleaseDates().getResults() != null) {
            // First try to find US rating
            for (TmdbMovieDetailsResponse.TmdbCountryReleaseDatesDto country : raw.getReleaseDates().getResults()) {
                if ("US".equalsIgnoreCase(country.getCountryCode()) && country.getReleaseDates() != null) {
                    for (TmdbMovieDetailsResponse.TmdbReleaseDateItemDto item : country.getReleaseDates()) {
                        if (StringUtils.hasText(item.getCertification())) {
                            contentRating = item.getCertification();
                            break;
                        }
                    }
                }
                if (contentRating != null) break;
            }
            // Fallback to first non-empty certification if US not found
            if (contentRating == null) {
                for (TmdbMovieDetailsResponse.TmdbCountryReleaseDatesDto country : raw.getReleaseDates().getResults()) {
                    if (country.getReleaseDates() != null) {
                        for (TmdbMovieDetailsResponse.TmdbReleaseDateItemDto item : country.getReleaseDates()) {
                            if (StringUtils.hasText(item.getCertification())) {
                                contentRating = item.getCertification();
                                break;
                            }
                        }
                    }
                    if (contentRating != null) break;
                }
            }
        }

        // 4. Streaming Providers
        List<StreamingProviderDto> streamingProviders = new ArrayList<>();
        if (raw.getWatchProviders() != null && raw.getWatchProviders().getResults() != null) {
            TmdbMovieDetailsResponse.TmdbCountryWatchProvidersDto usProviders = raw.getWatchProviders().getResults().get("US");
            if (usProviders == null && !raw.getWatchProviders().getResults().isEmpty()) {
                usProviders = raw.getWatchProviders().getResults().values().iterator().next();
            }

            if (usProviders != null) {
                if (usProviders.getFlatrate() != null) {
                    for (TmdbMovieDetailsResponse.TmdbProviderItemDto item : usProviders.getFlatrate()) {
                        streamingProviders.add(StreamingProviderDto.builder()
                                .providerId(item.getProviderId())
                                .providerName(item.getProviderName())
                                .logoPath(item.getLogoPath())
                                .type("Stream")
                                .build());
                    }
                }
                if (usProviders.getRent() != null) {
                    for (TmdbMovieDetailsResponse.TmdbProviderItemDto item : usProviders.getRent()) {
                        streamingProviders.add(StreamingProviderDto.builder()
                                .providerId(item.getProviderId())
                                .providerName(item.getProviderName())
                                .logoPath(item.getLogoPath())
                                .type("Rent")
                                .build());
                    }
                }
            }
        }

        // Format Runtime
        String formattedRuntime = null;
        if (raw.getRuntime() != null && raw.getRuntime() > 0) {
            int hours = raw.getRuntime() / 60;
            int mins = raw.getRuntime() % 60;
            if (hours > 0) {
                formattedRuntime = mins > 0 ? String.format("%dh %dm", hours, mins) : String.format("%dh", hours);
            } else {
                formattedRuntime = String.format("%dm", mins);
            }
        }

        return MovieDetailsDto.builder()
                .tmdbId(raw.getId())
                .title(raw.getTitle())
                .tagline(raw.getTagline())
                .overview(raw.getOverview())
                .posterPath(raw.getPosterPath())
                .backdropPath(raw.getBackdropPath())
                .releaseYear(extractReleaseYear(raw.getReleaseDate()))
                .releaseDate(raw.getReleaseDate())
                .runtime(raw.getRuntime())
                .formattedRuntime(formattedRuntime)
                .contentRating(contentRating)
                .voteAverage(raw.getVoteAverage())
                .voteCount(raw.getVoteCount())
                .popularity(raw.getPopularity())
                .originalLanguage(raw.getOriginalLanguage())
                .genres(genres)
                .directors(directors)
                .topCast(topCast)
                .streamingProviders(streamingProviders)
                .tmdbUrl("https://www.themoviedb.org/movie/" + raw.getId())
                .build();
    }

    private Integer extractReleaseYear(String releaseDate) {
        if (StringUtils.hasText(releaseDate) && releaseDate.length() >= 4) {
            try {
                return Integer.parseInt(releaseDate.substring(0, 4));
            } catch (NumberFormatException e) {
                log.debug("Failed to parse release year from date: {}", releaseDate);
            }
        }
        return null;
    }
}
