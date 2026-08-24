package com.moviepicker.backend.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
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
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
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
public class AiRecommendationServiceImpl implements AiRecommendationService {

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9\\s]");
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 5;
    private static final int MAX_PAGE_SIZE = 10;

    private final GeminiClient geminiClient;
    private final MovieSearchService movieSearchService;
    private final SessionRepository sessionRepository;
    private final MovieSuggestionRepository movieSuggestionRepository;
    private final GeminiProperties geminiProperties;
    private final Cache<String, CachedAiResult> recommendationCache;

    public AiRecommendationServiceImpl(
            GeminiClient geminiClient,
            MovieSearchService movieSearchService,
            SessionRepository sessionRepository,
            MovieSuggestionRepository movieSuggestionRepository,
            GeminiProperties geminiProperties) {

        this.geminiClient = geminiClient;
        this.movieSearchService = movieSearchService;
        this.sessionRepository = sessionRepository;
        this.movieSuggestionRepository = movieSuggestionRepository;
        this.geminiProperties = geminiProperties;

        int ttlMinutes = (geminiProperties != null && geminiProperties.getCacheTtlMinutes() > 0)
                ? geminiProperties.getCacheTtlMinutes()
                : 15;

        this.recommendationCache = Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(Duration.ofMinutes(ttlMinutes))
                .build();
    }

    @Data
    @AllArgsConstructor
    private static class CachedAiResult {
        private final String replyMessage;
        private final List<MovieDto> allMovies;
        private final String modelUsed;
    }

    @Override
    @Transactional(readOnly = true)
    public AiRecommendationResponse getRecommendations(String roomCode, AiRecommendationRequest request) {
        log.info("Generating AI recommendations for roomCode='{}', prompt='{}'", roomCode, request != null ? request.getPrompt() : null);

        Set<String> excludedTitles = new HashSet<>();
        Set<Long> excludedTmdbIds = new HashSet<>();

        if (request != null && request.getExcludedTmdbIds() != null) {
            excludedTmdbIds.addAll(request.getExcludedTmdbIds());
        }

        String normalizedRoomCode = null;
        if (StringUtils.hasText(roomCode)) {
            normalizedRoomCode = roomCode.trim().toUpperCase();
            Session session = sessionRepository.findByRoomCode(normalizedRoomCode)
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

        return executeRecommendationPipeline(normalizedRoomCode, request, excludedTitles, excludedTmdbIds);
    }

    @Override
    public AiRecommendationResponse getRecommendations(AiRecommendationRequest request) {
        return getRecommendations(null, request);
    }

    private AiRecommendationResponse executeRecommendationPipeline(
            String roomCode,
            AiRecommendationRequest request,
            Set<String> excludedTitles,
            Set<Long> excludedTmdbIds) {

        String prompt = request != null ? request.getPrompt() : null;
        int page = resolvePage(request != null ? request.getPage() : null);
        int pageSize = resolvePageSize(request != null ? request.getLimit() : null);

        if (!StringUtils.hasText(prompt)) {
            return AiRecommendationResponse.builder()
                    .prompt(prompt != null ? prompt : "")
                    .replyMessage("Please provide a mood, genre, or vibe to get movie recommendations.")
                    .movies(Collections.emptyList())
                    .page(page)
                    .pageSize(pageSize)
                    .totalResults(0)
                    .hasMore(false)
                    .modelUsed(resolveModelName())
                    .cached(false)
                    .build();
        }

        String cacheKey = (StringUtils.hasText(roomCode) ? roomCode : "GLOBAL") + ":" + prompt.trim().toLowerCase();
        CachedAiResult cached = recommendationCache.getIfPresent(cacheKey);

        if (cached != null) {
            log.debug("Serving AI recommendations from cache for key='{}' (page={}, pageSize={})", cacheKey, page, pageSize);
            return paginateResult(prompt, cached.getReplyMessage(), cached.getAllMovies(), cached.getModelUsed(), page, pageSize, true);
        }

        int targetFetch = (geminiProperties != null && geminiProperties.getFetchTarget() > 0)
                ? geminiProperties.getFetchTarget()
                : 8;

        AiRawGeminiResult rawResult;
        try {
            rawResult = geminiClient.generateRecommendations(
                    prompt.trim(),
                    request != null ? request.getConversationHistory() : Collections.emptyList(),
                    excludedTitles,
                    targetFetch
            );
        } catch (Exception ex) {
            log.warn("Gemini API call failed or rate-limited: {}", ex.getMessage());
            return AiRecommendationResponse.builder()
                    .prompt(prompt)
                    .replyMessage("The AI Concierge is currently experiencing high demand. Please try again in a few moments!")
                    .movies(Collections.emptyList())
                    .page(page)
                    .pageSize(pageSize)
                    .totalResults(0)
                    .hasMore(false)
                    .modelUsed(resolveModelName())
                    .cached(false)
                    .build();
        }

        if (rawResult == null || rawResult.getSuggestions() == null || rawResult.getSuggestions().isEmpty()) {
            String reply = (rawResult != null && StringUtils.hasText(rawResult.getReplyMessage()))
                    ? rawResult.getReplyMessage()
                    : "I couldn't find any movie recommendations for that vibe. Try asking for a specific mood, genre, or favorite actor!";

            return AiRecommendationResponse.builder()
                    .prompt(prompt)
                    .replyMessage(reply)
                    .movies(Collections.emptyList())
                    .page(page)
                    .pageSize(pageSize)
                    .totalResults(0)
                    .hasMore(false)
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

        List<MovieDto> allMovies = new ArrayList<>();
        Set<Long> seenTmdbIds = new HashSet<>(excludedTmdbIds);

        for (MovieDto movie : enrichedResults) {
            if (movie.getTmdbId() != null) {
                if (seenTmdbIds.add(movie.getTmdbId())) {
                    allMovies.add(movie);
                }
            } else {
                allMovies.add(movie);
            }
        }

        String modelUsed = resolveModelName();
        if (!allMovies.isEmpty()) {
            recommendationCache.put(cacheKey, new CachedAiResult(rawResult.getReplyMessage(), allMovies, modelUsed));
        }

        return paginateResult(prompt, rawResult.getReplyMessage(), allMovies, modelUsed, page, pageSize, false);
    }

    private AiRecommendationResponse paginateResult(
            String prompt,
            String replyMessage,
            List<MovieDto> allMovies,
            String modelUsed,
            int page,
            int pageSize,
            boolean isCached) {

        int totalResults = allMovies != null ? allMovies.size() : 0;
        int startIndex = (page - 1) * pageSize;

        List<MovieDto> pageSlice;
        if (allMovies == null || startIndex >= totalResults) {
            pageSlice = Collections.emptyList();
        } else {
            int endIndex = Math.min(startIndex + pageSize, totalResults);
            pageSlice = allMovies.subList(startIndex, endIndex);
        }

        boolean hasMore = (startIndex + pageSlice.size()) < totalResults;

        return AiRecommendationResponse.builder()
                .prompt(prompt)
                .replyMessage(replyMessage)
                .movies(pageSlice)
                .page(page)
                .pageSize(pageSize)
                .totalResults(totalResults)
                .hasMore(hasMore)
                .modelUsed(modelUsed)
                .cached(isCached)
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

    private int resolvePage(Integer requestedPage) {
        if (requestedPage == null || requestedPage < 1) {
            return DEFAULT_PAGE;
        }
        return requestedPage;
    }

    private int resolvePageSize(Integer requestedLimit) {
        if (requestedLimit == null || requestedLimit <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(requestedLimit, MAX_PAGE_SIZE);
    }

    private String resolveModelName() {
        return (geminiProperties != null && StringUtils.hasText(geminiProperties.getModel()))
                ? geminiProperties.getModel()
                : "gemini-3.5-flash-lite";
    }

    public void clearCache() {
        recommendationCache.invalidateAll();
    }
}
