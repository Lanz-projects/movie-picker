package com.moviepicker.backend.service;

import com.moviepicker.backend.client.TmdbClient;
import com.moviepicker.backend.dto.MovieDto;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.dto.tmdb.TmdbMovieDto;
import com.moviepicker.backend.dto.tmdb.TmdbSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovieSearchServiceImpl implements MovieSearchService {

    private final TmdbClient tmdbClient;

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

    private MovieDto mapToMovieDto(TmdbMovieDto dto) {
        return MovieDto.builder()
                .tmdbId(dto.getId())
                .title(dto.getTitle())
                .overview(dto.getOverview())
                .posterPath(dto.getPosterPath())
                .releaseYear(extractReleaseYear(dto.getReleaseDate()))
                .voteAverage(dto.getVoteAverage())
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
