package com.moviepicker.backend.service;

import com.moviepicker.backend.client.GeminiClient;
import com.moviepicker.backend.config.GeminiProperties;
import com.moviepicker.backend.dto.MovieDto;
import com.moviepicker.backend.dto.MovieSearchResponse;
import com.moviepicker.backend.dto.ai.AiMovieSuggestion;
import com.moviepicker.backend.dto.ai.AiRawGeminiResult;
import com.moviepicker.backend.dto.ai.AiRecommendationRequest;
import com.moviepicker.backend.dto.ai.AiRecommendationResponse;
import com.moviepicker.backend.exception.ResourceNotFoundException;
import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationServiceImpl implements AiRecommendationService {

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9\\s]");
    private static final int DEFAULT_LIMIT = 4;
    private static final int MAX_LIMIT = 10;

    private final GeminiClient geminiClient;
    private final MovieSearchService movieSearchService;
    private final SessionRepository sessionRepository;
    private final MovieSuggestionRepository movieSuggestionRepository;
    private final GeminiProperties geminiProperties;

    @Override
    @Transactional(readOnly = true)
    public AiRecommendationResponse getRecommendations(String roomCode, AiRecommendationRequest request) {
        log.info("Generating AI recommendations for roomCode='{}', prompt='{}'", roomCode, request != null ? request.getPrompt() : null);

        Set<String> excludedTitles = new HashSet<>();
        Set<Long> excludedTmdbIds = new HashSet<>();

        if (request != null && request.getExcludedTmdbIds() != null) {
            excludedTmdbIds.addAll(request.getExcludedTmdbIds());
        }

        if (StringUtils.hasText(roomCode)) {
            Session session = sessionRepository.findByRoomCode(roomCode.trim().toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found with room code: " + roomCode));

            List<MovieSuggestion> sessionSuggestions = movieSuggestionRepository.findBySessionId(session.getId());
            for (MovieSuggestion suggestion : sessionSuggestions) {
                if (StringUtils.hasText(suggestion.getTitle())) {
                    excludedTitles.add(suggestion.getTitle().trim());
                }
                if (suggestion.getTmdbId() != null) {
                    excludedTmdbIds.add(suggestion.getTmdbId());
                }
            }
        }

        return executeRecommendationPipeline(request, excludedTitles, excludedTmdbIds);
    }

    @Override
    public AiRecommendationResponse getRecommendations(AiRecommendationRequest request) {
        return getRecommendations(null, request);
    }

    private AiRecommendationResponse executeRecommendationPipeline(
            AiRecommendationRequest request,
            Set<String> excludedTitles,
            Set<Long> excludedTmdbIds) {

        String prompt = request != null ? request.getPrompt() : null;
        if (!StringUtils.hasText(prompt)) {
            return AiRecommendationResponse.builder()
                    .prompt(prompt != null ? prompt : "")
                    .replyMessage("Please provide a mood, genre, or vibe to get movie recommendations.")
                    .movies(Collections.emptyList())
                    .modelUsed(resolveModelName())
                    .cached(false)
                    .build();
        }

        int limit = resolveLimit(request != null ? request.getLimit() : DEFAULT_LIMIT);
        AiRawGeminiResult rawResult = geminiClient.generateRecommendations(
                prompt.trim(),
                request != null ? request.getConversationHistory() : Collections.emptyList(),
                excludedTitles,
                limit
        );

        if (rawResult == null || rawResult.getSuggestions() == null || rawResult.getSuggestions().isEmpty()) {
            String reply = (rawResult != null && StringUtils.hasText(rawResult.getReplyMessage()))
                    ? rawResult.getReplyMessage()
                    : "I couldn't find any movie recommendations for that vibe. Try asking for a specific mood, genre, or favorite actor!";

            return AiRecommendationResponse.builder()
                    .prompt(prompt)
                    .replyMessage(reply)
                    .movies(Collections.emptyList())
                    .modelUsed(resolveModelName())
                    .cached(false)
                    .build();
        }

        List<CompletableFuture<MovieDto>> futures = rawResult.getSuggestions().stream()
                .filter(suggestion -> suggestion != null && StringUtils.hasText(suggestion.getTitle()))
                .map(suggestion -> CompletableFuture.supplyAsync(() -> enrichWithTmdb(suggestion, excludedTmdbIds)))
                .toList();

        List<MovieDto> enrichedResults = futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .toList();

        List<MovieDto> finalMovies = new ArrayList<>();
        Set<Long> seenTmdbIds = new HashSet<>(excludedTmdbIds);

        for (MovieDto movie : enrichedResults) {
            if (movie.getTmdbId() != null) {
                if (seenTmdbIds.add(movie.getTmdbId())) {
                    finalMovies.add(movie);
                }
            } else {
                finalMovies.add(movie);
            }

            if (finalMovies.size() >= limit) {
                break;
            }
        }

        return AiRecommendationResponse.builder()
                .prompt(prompt)
                .replyMessage(rawResult.getReplyMessage())
                .movies(finalMovies)
                .modelUsed(resolveModelName())
                .cached(false)
                .build();
    }

    private MovieDto enrichWithTmdb(AiMovieSuggestion suggestion, Set<Long> excludedTmdbIds) {
        String title = suggestion.getTitle().trim();
        try {
            MovieSearchResponse searchResponse = movieSearchService.searchMovies(title, 1);
            if (searchResponse == null || searchResponse.getMovies() == null || searchResponse.getMovies().isEmpty()) {
                log.debug("No TMDB search results found for AI suggestion: '{}' ({})", title, suggestion.getYear());
                return createFallbackMovieDto(suggestion);
            }

            MovieDto bestMatch = selectBestCandidate(searchResponse.getMovies(), suggestion, excludedTmdbIds);
            if (bestMatch != null) {
                return cloneAndAttachReasoning(bestMatch, suggestion.getVibeMatch());
            }

            return createFallbackMovieDto(suggestion);
        } catch (Exception ex) {
            log.warn("Failed to enrich AI suggestion '{}' with TMDB: {}", title, ex.getMessage());
            return createFallbackMovieDto(suggestion);
        }
    }

    private MovieDto selectBestCandidate(List<MovieDto> candidates, AiMovieSuggestion suggestion, Set<Long> excludedTmdbIds) {
        String targetTitle = suggestion.getTitle();
        Integer targetYear = suggestion.getYear();
        String normalizedTarget = normalizeTitle(targetTitle);

        MovieDto exactTitleAndYear = null;
        MovieDto exactTitle = null;
        MovieDto normalizedTitleAndNearYear = null;
        MovieDto normalizedTitle = null;
        MovieDto firstNonExcluded = null;

        for (MovieDto candidate : candidates) {
            if (candidate == null) {
                continue;
            }
            if (candidate.getTmdbId() != null && excludedTmdbIds.contains(candidate.getTmdbId())) {
                continue;
            }

            if (firstNonExcluded == null) {
                firstNonExcluded = candidate;
            }

            boolean isExactTitle = StringUtils.hasText(candidate.getTitle()) &&
                    candidate.getTitle().trim().equalsIgnoreCase(targetTitle.trim());
            boolean isYearMatch = targetYear != null && candidate.getReleaseYear() != null &&
                    targetYear.equals(candidate.getReleaseYear());
            boolean isNearYearMatch = targetYear != null && candidate.getReleaseYear() != null &&
                    Math.abs(targetYear - candidate.getReleaseYear()) <= 1;

            String candidateNormalized = normalizeTitle(candidate.getTitle());
            boolean isNormalizedTitle = StringUtils.hasText(candidateNormalized) &&
                    candidateNormalized.equals(normalizedTarget);

            if (isExactTitle && isYearMatch) {
                exactTitleAndYear = candidate;
                break;
            }
            if (isExactTitle && exactTitle == null) {
                exactTitle = candidate;
            }
            if (isNormalizedTitle && isNearYearMatch && normalizedTitleAndNearYear == null) {
                normalizedTitleAndNearYear = candidate;
            }
            if (isNormalizedTitle && normalizedTitle == null) {
                normalizedTitle = candidate;
            }
        }

        if (exactTitleAndYear != null) return exactTitleAndYear;
        if (exactTitle != null) return exactTitle;
        if (normalizedTitleAndNearYear != null) return normalizedTitleAndNearYear;
        if (normalizedTitle != null) return normalizedTitle;
        return firstNonExcluded;
    }

    private MovieDto cloneAndAttachReasoning(MovieDto base, String vibeMatch) {
        return MovieDto.builder()
                .tmdbId(base.getTmdbId())
                .title(base.getTitle())
                .overview(base.getOverview())
                .posterPath(base.getPosterPath())
                .backdropPath(base.getBackdropPath())
                .releaseYear(base.getReleaseYear())
                .releaseDate(base.getReleaseDate())
                .voteAverage(base.getVoteAverage())
                .voteCount(base.getVoteCount())
                .popularity(base.getPopularity())
                .originalLanguage(base.getOriginalLanguage())
                .genres(base.getGenres() != null ? new ArrayList<>(base.getGenres()) : new ArrayList<>())
                .aiReasoning(vibeMatch)
                .build();
    }

    private MovieDto createFallbackMovieDto(AiMovieSuggestion suggestion) {
        return MovieDto.builder()
                .title(suggestion.getTitle())
                .releaseYear(suggestion.getYear())
                .aiReasoning(suggestion.getVibeMatch())
                .genres(new ArrayList<>())
                .build();
    }

    private String normalizeTitle(String title) {
        if (!StringUtils.hasText(title)) {
            return "";
        }
        String cleaned = NON_ALPHANUMERIC.matcher(title.trim().toLowerCase()).replaceAll("");
        if (cleaned.startsWith("the ")) {
            cleaned = cleaned.substring(4).trim();
        } else if (cleaned.startsWith("a ")) {
            cleaned = cleaned.substring(2).trim();
        } else if (cleaned.startsWith("an ")) {
            cleaned = cleaned.substring(3).trim();
        }
        return cleaned;
    }

    private int resolveLimit(int requestedLimit) {
        if (requestedLimit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(requestedLimit, MAX_LIMIT);
    }

    private String resolveModelName() {
        return (geminiProperties != null && StringUtils.hasText(geminiProperties.getModel()))
                ? geminiProperties.getModel()
                : "gemini-2.5-flash-lite";
    }
}
