package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.MovieSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieSuggestionRepository extends JpaRepository<MovieSuggestion, Long> {
    List<MovieSuggestion> findBySessionId(Long sessionId);
    List<MovieSuggestion> findByUserId(Long userId);
    long countBySessionIdAndUserId(Long sessionId, Long userId);
    boolean existsBySessionIdAndTmdbId(Long sessionId, Long tmdbId);
}
