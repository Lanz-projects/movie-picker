package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.MovieSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieSuggestionRepository extends JpaRepository<MovieSuggestion, Long> {
    List<MovieSuggestion> findBySessionId(Long sessionId);

    @Query("SELECT m FROM MovieSuggestion m LEFT JOIN FETCH m.user WHERE m.session.id = :sessionId")
    List<MovieSuggestion> findBySessionIdWithUser(@Param("sessionId") Long sessionId);

    List<MovieSuggestion> findByUserId(Long userId);
    long countBySessionIdAndUserId(Long sessionId, Long userId);
    boolean existsBySessionIdAndTmdbId(Long sessionId, Long tmdbId);
}
