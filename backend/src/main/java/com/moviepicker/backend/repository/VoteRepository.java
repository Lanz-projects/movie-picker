package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.Vote;
import com.moviepicker.backend.model.VoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    List<Vote> findBySessionId(Long sessionId);

    List<Vote> findBySessionIdAndMovieSuggestionId(Long sessionId, Long movieSuggestionId);

    List<Vote> findBySessionIdAndUserId(Long sessionId, Long userId);

    long countBySessionIdAndUserId(Long sessionId, Long userId);

    long countBySessionIdAndMovieSuggestionIdAndVoteType(Long sessionId, Long movieSuggestionId, VoteType voteType);

    boolean existsByUserIdAndMovieSuggestionId(Long userId, Long movieSuggestionId);
}
