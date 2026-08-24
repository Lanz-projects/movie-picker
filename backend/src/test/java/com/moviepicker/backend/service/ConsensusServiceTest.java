package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.model.*;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.repository.VoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ConsensusServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MovieSuggestionRepository movieSuggestionRepository;

    @Mock
    private VoteRepository voteRepository;

    @InjectMocks
    private ConsensusServiceImpl consensusService;

    private Session session;
    private User user1;
    private User user2;
    private MovieSuggestion movie1;
    private MovieSuggestion movie2;

    @BeforeEach
    public void setUp() {
        session = Session.builder()
                .id(1L)
                .roomCode("WINNER")
                .hostName("Alice")
                .status(SessionStatus.VOTING)
                .maxUsers(5)
                .maxSuggestionsPerUser(3)
                .createdAt(LocalDateTime.now())
                .build();

        user1 = User.builder().id(10L).session(session).displayName("Alice").build();
        user2 = User.builder().id(11L).session(session).displayName("Bob").build();

        movie1 = MovieSuggestion.builder()
                .id(100L)
                .session(session)
                .user(user1)
                .tmdbId(550L)
                .title("Fight Club")
                .releaseYear(1999)
                .build();

        movie2 = MovieSuggestion.builder()
                .id(101L)
                .session(session)
                .user(user2)
                .tmdbId(680L)
                .title("Pulp Fiction")
                .releaseYear(1994)
                .build();
    }

    @Test
    public void testCalculateResults_UnanimousMatch_Success() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(movieSuggestionRepository.findBySessionIdWithUser(1L)).thenReturn(List.of(movie1, movie2));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(user1, user2));

        // Movie 1: 2 YES votes (unanimous)
        Vote v1 = Vote.builder().session(session).user(user1).movieSuggestion(movie1).voteType(VoteType.YES).build();
        Vote v2 = Vote.builder().session(session).user(user2).movieSuggestion(movie1).voteType(VoteType.YES).build();

        // Movie 2: 1 YES vote, 1 NO vote
        Vote v3 = Vote.builder().session(session).user(user1).movieSuggestion(movie2).voteType(VoteType.YES).build();
        Vote v4 = Vote.builder().session(session).user(user2).movieSuggestion(movie2).voteType(VoteType.NO).build();

        when(voteRepository.findBySessionIdWithUserAndMovie(1L)).thenReturn(List.of(v1, v2, v3, v4));

        SessionResultsResponse response = consensusService.calculateResults(1L);

        assertThat(response).isNotNull();
        assertThat(response.getTotalParticipants()).isEqualTo(2);
        assertThat(response.getTotalMovies()).isEqualTo(2);
        assertThat(response.getWinner()).isNotNull();
        assertThat(response.getWinner().getTitle()).isEqualTo("Fight Club");
        assertThat(response.getWinner().getScore()).isEqualTo(2);
        assertThat(response.getWinner().getMatchPercentage()).isEqualTo(100.0);
        assertThat(response.getWinner().isUnanimous()).isTrue();
        assertThat(response.getWinner().getSuggestedBy()).isEqualTo("Alice");
        assertThat(response.getWinner().getPositiveVoters()).containsExactlyInAnyOrder("Alice", "Bob");

        assertThat(response.getRankedMovies().get(1).getTitle()).isEqualTo("Pulp Fiction");
        assertThat(response.getRankedMovies().get(1).getScore()).isEqualTo(1);
        assertThat(response.getRankedMovies().get(1).getMatchPercentage()).isEqualTo(50.0);
        assertThat(response.getRankedMovies().get(1).isUnanimous()).isFalse();
        assertThat(response.getRankedMovies().get(1).getSuggestedBy()).isEqualTo("Bob");
        assertThat(response.getRankedMovies().get(1).getPositiveVoters()).containsExactly("Alice");

        assertThat(session.getStatus()).isEqualTo(SessionStatus.COMPLETED);
        verify(sessionRepository).save(session);
    }

    @Test
    public void testCalculateResults_SuperlikeBreaksTie() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(movieSuggestionRepository.findBySessionIdWithUser(1L)).thenReturn(List.of(movie1, movie2));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(user1, user2));

        // Movie 1: 1 SUPERLIKE (score 2)
        Vote v1 = Vote.builder().session(session).user(user1).movieSuggestion(movie1).voteType(VoteType.SUPERLIKE).build();

        // Movie 2: 1 YES vote (score 1)
        Vote v2 = Vote.builder().session(session).user(user2).movieSuggestion(movie2).voteType(VoteType.YES).build();

        when(voteRepository.findBySessionIdWithUserAndMovie(1L)).thenReturn(List.of(v1, v2));

        SessionResultsResponse response = consensusService.calculateResults(1L);

        assertThat(response.getWinner().getTitle()).isEqualTo("Fight Club");
        assertThat(response.getWinner().getScore()).isEqualTo(2);
        assertThat(response.getWinner().getSuperlikeVotes()).isEqualTo(1);
    }

    @Test
    public void testCalculateResults_WaitingSession_ThrowsException() {
        session.setStatus(SessionStatus.WAITING);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> consensusService.calculateResults(1L))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("Cannot calculate results when session is in WAITING status");
    }

    @Test
    public void testGetResults_NonCompletedSession_ThrowsException() {
        session.setStatus(SessionStatus.VOTING);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> consensusService.getResults(1L))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("Results are only available for COMPLETED sessions");
    }

    @Test
    public void testCalculateResults_MultipleNominators_FormatsSuggestedBy() {
        MovieSuggestion multiNominatedMovie = MovieSuggestion.builder()
                .id(100L)
                .session(session)
                .user(user1)
                .nominators(new java.util.HashSet<>(List.of(user1, user2)))
                .tmdbId(550L)
                .title("Fight Club")
                .releaseYear(1999)
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(movieSuggestionRepository.findBySessionIdWithUser(1L)).thenReturn(List.of(multiNominatedMovie));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(user1, user2));
        when(voteRepository.findBySessionIdWithUserAndMovie(1L)).thenReturn(List.of());

        SessionResultsResponse response = consensusService.calculateResults(1L);

        assertThat(response.getWinner()).isNotNull();
        assertThat(response.getWinner().getNominators()).containsExactlyInAnyOrder("Alice", "Bob");
        assertThat(response.getWinner().getSuggestedBy()).contains("Alice").contains("Bob");
    }
}
