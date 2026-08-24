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

    @Query("SELECT DISTINCT m FROM MovieSuggestion m LEFT JOIN FETCH m.user LEFT JOIN FETCH m.nominators WHERE m.session.id = :sessionId")
    List<MovieSuggestion> findBySessionIdWithUser(@Param("sessionId") Long sessionId);

    @Query("SELECT m FROM MovieSuggestion m LEFT JOIN FETCH m.nominators WHERE m.session.id = :sessionId AND m.tmdbId = :tmdbId")
    java.util.Optional<MovieSuggestion> findBySessionIdAndTmdbIdWithNominators(@Param("sessionId") Long sessionId, @Param("tmdbId") Long tmdbId);

    @Query("SELECT m.tmdbId FROM MovieSuggestion m WHERE m.session.id = :sessionId")
    java.util.Set<Long> findExistingTmdbIdsBySessionId(@Param("sessionId") Long sessionId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE MovieSuggestion m SET m.user = null WHERE m.user.id = :userId")
    void disassociateUserSuggestions(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "DELETE FROM movie_suggestion_nominators WHERE user_id = :userId", nativeQuery = true)
    void removeUserFromNominators(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM MovieSuggestion m WHERE m.session.id = :sessionId")
    void deleteBySessionId(@Param("sessionId") Long sessionId);

    List<MovieSuggestion> findByUserId(Long userId);
    long countBySessionIdAndUserId(Long sessionId, Long userId);
    boolean existsBySessionIdAndTmdbId(Long sessionId, Long tmdbId);
}
