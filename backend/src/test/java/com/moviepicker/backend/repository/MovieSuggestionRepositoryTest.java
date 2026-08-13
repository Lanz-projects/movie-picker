package com.moviepicker.backend.repository;

import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MovieSuggestionRepositoryTest {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieSuggestionRepository movieSuggestionRepository;

    private Session sampleSession;
    private User user1;
    private User user2;

    @BeforeEach
    public void setUp() {
        sampleSession = Session.builder()
                .roomCode("SUGG01")
                .hostName("Alice")
                .status(SessionStatus.WAITING)
                .build();
        sampleSession = sessionRepository.save(sampleSession);

        user1 = User.builder()
                .session(sampleSession)
                .displayName("Alice")
                .build();
        user1 = userRepository.save(user1);

        user2 = User.builder()
                .session(sampleSession)
                .displayName("Bob")
                .build();
        user2 = userRepository.save(user2);
    }

    @Test
    public void testSaveMovieSuggestionAndAutoTimestamp() {
        MovieSuggestion suggestion = MovieSuggestion.builder()
                .session(sampleSession)
                .user(user1)
                .tmdbId(550L)
                .title("Fight Club")
                .posterPath("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg")
                .overview("A ticking-time-bomb insomniac...")
                .releaseYear(1999)
                .build();

        MovieSuggestion saved = movieSuggestionRepository.save(suggestion);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getSuggestedAt()).isNotNull();
        assertThat(saved.getTmdbId()).isEqualTo(550L);
        assertThat(saved.getTitle()).isEqualTo("Fight Club");
        assertThat(saved.getReleaseYear()).isEqualTo(1999);
    }

    @Test
    public void testFindBySessionId() {
        MovieSuggestion suggestion1 = MovieSuggestion.builder()
                .session(sampleSession)
                .user(user1)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        MovieSuggestion suggestion2 = MovieSuggestion.builder()
                .session(sampleSession)
                .user(user2)
                .tmdbId(27205L)
                .title("Inception")
                .build();

        movieSuggestionRepository.save(suggestion1);
        movieSuggestionRepository.save(suggestion2);

        List<MovieSuggestion> suggestions = movieSuggestionRepository.findBySessionId(sampleSession.getId());

        assertThat(suggestions).hasSize(2);
        assertThat(suggestions).extracting(MovieSuggestion::getTitle)
                .containsExactlyInAnyOrder("Fight Club", "Inception");
    }

    @Test
    public void testCountBySessionIdAndUserId() {
        MovieSuggestion suggestion1 = MovieSuggestion.builder()
                .session(sampleSession)
                .user(user1)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        MovieSuggestion suggestion2 = MovieSuggestion.builder()
                .session(sampleSession)
                .user(user1)
                .tmdbId(27205L)
                .title("Inception")
                .build();

        MovieSuggestion suggestion3 = MovieSuggestion.builder()
                .session(sampleSession)
                .user(user2)
                .tmdbId(157336L)
                .title("Interstellar")
                .build();

        movieSuggestionRepository.saveAll(List.of(suggestion1, suggestion2, suggestion3));

        long countUser1 = movieSuggestionRepository.countBySessionIdAndUserId(sampleSession.getId(), user1.getId());
        long countUser2 = movieSuggestionRepository.countBySessionIdAndUserId(sampleSession.getId(), user2.getId());

        assertThat(countUser1).isEqualTo(2L);
        assertThat(countUser2).isEqualTo(1L);
    }

    @Test
    public void testExistsBySessionIdAndTmdbId() {
        MovieSuggestion suggestion = MovieSuggestion.builder()
                .session(sampleSession)
                .user(user1)
                .tmdbId(550L)
                .title("Fight Club")
                .build();

        movieSuggestionRepository.save(suggestion);

        boolean exists = movieSuggestionRepository.existsBySessionIdAndTmdbId(sampleSession.getId(), 550L);
        boolean notExists = movieSuggestionRepository.existsBySessionIdAndTmdbId(sampleSession.getId(), 99999L);

        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }
}
