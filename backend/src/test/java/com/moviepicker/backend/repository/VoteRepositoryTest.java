package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
public class VoteRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private VoteRepository voteRepository;

    private Session session;
    private User user1;
    private User user2;
    private MovieSuggestion movie1;
    private MovieSuggestion movie2;

    @BeforeEach
    public void setUp() {
        session = Session.builder()
                .roomCode("VOTE01")
                .hostName("Alice")
                .status(SessionStatus.VOTING)
                .maxUsers(5)
                .maxSuggestionsPerUser(3)
                .createdAt(LocalDateTime.now())
                .build();
        session = entityManager.persistAndFlush(session);

        user1 = User.builder()
                .session(session)
                .displayName("Alice")
                .joinedAt(LocalDateTime.now())
                .build();
        user1 = entityManager.persistAndFlush(user1);

        user2 = User.builder()
                .session(session)
                .displayName("Bob")
                .joinedAt(LocalDateTime.now().plusSeconds(1))
                .build();
        user2 = entityManager.persistAndFlush(user2);

        movie1 = MovieSuggestion.builder()
                .session(session)
                .user(user1)
                .tmdbId(550L)
                .title("Fight Club")
                .releaseYear(1999)
                .suggestedAt(LocalDateTime.now())
                .build();
        movie1 = entityManager.persistAndFlush(movie1);

        movie2 = MovieSuggestion.builder()
                .session(session)
                .user(user2)
                .tmdbId(27205L)
                .title("Inception")
                .releaseYear(2010)
                .suggestedAt(LocalDateTime.now())
                .build();
        movie2 = entityManager.persistAndFlush(movie2);
    }

    @Test
    public void testSaveAndFindVote_Success() {
        Vote vote = Vote.builder()
                .session(session)
                .user(user1)
                .movieSuggestion(movie1)
                .voteType(VoteType.YES)
                .build();

        Vote saved = voteRepository.save(vote);
        entityManager.flush();

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getVotedAt()).isNotNull();
        assertThat(saved.getVoteType()).isEqualTo(VoteType.YES);

        List<Vote> votes = voteRepository.findBySessionId(session.getId());
        assertThat(votes).hasSize(1);
        assertThat(votes.get(0).getUser().getDisplayName()).isEqualTo("Alice");
    }

    @Test
    public void testDuplicateVoteThrowsException() {
        Vote vote1 = Vote.builder()
                .session(session)
                .user(user1)
                .movieSuggestion(movie1)
                .voteType(VoteType.YES)
                .build();
        entityManager.persistAndFlush(vote1);

        Vote duplicateVote = Vote.builder()
                .session(session)
                .user(user1)
                .movieSuggestion(movie1)
                .voteType(VoteType.NO)
                .build();

        assertThatThrownBy(() -> {
            voteRepository.save(duplicateVote);
            entityManager.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    public void testCountQueriesAndExistence() {
        Vote v1 = Vote.builder()
                .session(session)
                .user(user1)
                .movieSuggestion(movie1)
                .voteType(VoteType.YES)
                .build();
        entityManager.persistAndFlush(v1);

        Vote v2 = Vote.builder()
                .session(session)
                .user(user1)
                .movieSuggestion(movie2)
                .voteType(VoteType.NO)
                .build();
        entityManager.persistAndFlush(v2);

        Vote v3 = Vote.builder()
                .session(session)
                .user(user2)
                .movieSuggestion(movie1)
                .voteType(VoteType.YES)
                .build();
        entityManager.persistAndFlush(v3);

        assertThat(voteRepository.countBySessionIdAndUserId(session.getId(), user1.getId())).isEqualTo(2L);
        assertThat(voteRepository.countBySessionIdAndUserId(session.getId(), user2.getId())).isEqualTo(1L);

        assertThat(voteRepository.countBySessionIdAndMovieSuggestionIdAndVoteType(
                session.getId(), movie1.getId(), VoteType.YES)).isEqualTo(2L);
        assertThat(voteRepository.countBySessionIdAndMovieSuggestionIdAndVoteType(
                session.getId(), movie2.getId(), VoteType.YES)).isEqualTo(0L);

        assertThat(voteRepository.existsByUserIdAndMovieSuggestionId(user1.getId(), movie1.getId())).isTrue();
        assertThat(voteRepository.existsByUserIdAndMovieSuggestionId(user2.getId(), movie2.getId())).isFalse();
    }
}
