package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.Vote;
import com.moviepicker.backend.model.VoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    List<Vote> findBySessionId(Long sessionId);

    @Query("SELECT v FROM Vote v LEFT JOIN FETCH v.user LEFT JOIN FETCH v.movieSuggestion WHERE v.session.id = :sessionId")
    List<Vote> findBySessionIdWithUserAndMovie(@Param("sessionId") Long sessionId);

    @Query("SELECT v.user.id, COUNT(v) FROM Vote v WHERE v.session.id = :sessionId GROUP BY v.user.id")
    List<Object[]> countVotesGroupedByUserId(@Param("sessionId") Long sessionId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Vote v WHERE v.session.id = :sessionId AND v.user.id = :userId")
    void deleteBySessionIdAndUserId(@Param("sessionId") Long sessionId, @Param("userId") Long userId);

    List<Vote> findBySessionIdAndMovieSuggestionId(Long sessionId, Long movieSuggestionId);

    List<Vote> findBySessionIdAndUserId(Long sessionId, Long userId);

    long countBySessionIdAndUserId(Long sessionId, Long userId);

    long countBySessionIdAndMovieSuggestionIdAndVoteType(Long sessionId, Long movieSuggestionId, VoteType voteType);

    boolean existsByUserIdAndMovieSuggestionId(Long userId, Long movieSuggestionId);
}
