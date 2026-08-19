package com.moviepicker.backend.util;

import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * Utility class containing TMDB genre and provider mappings.
 */
public final class TmdbMappingUtil {

    private TmdbMappingUtil() {
        // Prevent instantiation
    }

    public static final Map<Integer, String> TMDB_GENRE_MAP = Map.ofEntries(
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

    public static final Map<String, Integer> GENRE_NAME_TO_ID_MAP = Map.ofEntries(
            Map.entry("action", 28),
            Map.entry("adventure", 12),
            Map.entry("animation", 16),
            Map.entry("comedy", 35),
            Map.entry("crime", 80),
            Map.entry("documentary", 99),
            Map.entry("drama", 18),
            Map.entry("family", 10751),
            Map.entry("fantasy", 14),
            Map.entry("history", 36),
            Map.entry("horror", 27),
            Map.entry("music", 10402),
            Map.entry("mystery", 9648),
            Map.entry("romance", 10749),
            Map.entry("sci-fi", 878),
            Map.entry("science fiction", 878),
            Map.entry("tv movie", 10770),
            Map.entry("thriller", 53),
            Map.entry("war", 10752),
            Map.entry("western", 37)
    );

    public static final Map<String, Integer> PROVIDER_NAME_TO_ID_MAP = Map.ofEntries(
            Map.entry("netflix", 8),
            Map.entry("amazon prime", 9),
            Map.entry("amazon prime video", 9),
            Map.entry("prime video", 9),
            Map.entry("disney plus", 337),
            Map.entry("disney+", 337),
            Map.entry("max", 1899),
            Map.entry("hbo max", 1899),
            Map.entry("apple tv plus", 350),
            Map.entry("apple tv+", 350),
            Map.entry("hulu", 15),
            Map.entry("paramount plus", 531),
            Map.entry("paramount+", 531),
            Map.entry("peacock", 386),
            Map.entry("peacock premium", 386)
    );

    public static Integer resolveGenreId(String genre) {
        if (!StringUtils.hasText(genre)) {
            return null;
        }
        return GENRE_NAME_TO_ID_MAP.get(genre.trim().toLowerCase());
    }

    public static Integer resolveProviderId(String provider) {
        if (!StringUtils.hasText(provider)) {
            return null;
        }
        return PROVIDER_NAME_TO_ID_MAP.get(provider.trim().toLowerCase());
    }

    public static String resolveGenreName(Integer id) {
        if (id == null) {
            return "Other";
        }
        return TMDB_GENRE_MAP.getOrDefault(id, "Other");
    }
}
