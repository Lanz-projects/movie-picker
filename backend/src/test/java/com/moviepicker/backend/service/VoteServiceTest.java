package com.moviepicker.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.moviepicker.backend.dto.CastVoteRequest;
import com.moviepicker.backend.dto.VoteResponse;
import com.moviepicker.backend.dto.VotingProgressResponse;
import com.moviepicker.backend.exception.DuplicateVoteException;
import com.moviepicker.backend.exception.InvalidSessionStateException;
import com.moviepicker.backend.model.MovieSuggestion;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.model.Vote;
import com.moviepicker.backend.model.VoteType;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.repository.VoteRepository;

@ExtendWith(MockitoExtension.class)
public class VoteServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MovieSuggestionRepository movieSuggestionRepository;

    @Mock
    private VoteRepository voteRepository;

    @Mock
    private ConsensusService consensusService;

    @Mock
    private RoomEventPublisher roomEventPublisher;

    @InjectMocks
    private VoteServiceImpl voteService;

    private Session session;
    private User user;
    private MovieSuggestion movieSuggestion;

    @BeforeEach
    public void setUp() {
        session = Session.builder()
                .id(1L)
                .roomCode("SWIPE1")
                .hostName("Alice")
                .status(SessionStatus.VOTING)
                .maxUsers(5)
                .maxSuggestionsPerUser(3)
                .createdAt(LocalDateTime.now())
                .build();

        user = User.builder()
                .id(10L)
                .session(session)
                .displayName("Alice")
                .joinedAt(LocalDateTime.now())
                .build();

        movieSuggestion = MovieSuggestion.builder()
                .id(100L)
                .session(session)
                .user(user)
                .tmdbId(550L)
                .title("Fight Club")
                .releaseYear(1999)
                .suggestedAt(LocalDateTime.now())
                .build();
    }

    @Test
    public void testCastVote_Success() {
        CastVoteRequest request = CastVoteRequest.builder()
                .userId(10L)
                .movieSuggestionId(100L)
                .voteType(VoteType.YES)
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(movieSuggestionRepository.findById(100L)).thenReturn(Optional.of(movieSuggestion));
        when(voteRepository.existsByUserIdAndMovieSuggestionId(10L, 100L)).thenReturn(false);

        Vote savedVote = Vote.builder()
                .id(500L)
                .session(session)
                .user(user)
                .movieSuggestion(movieSuggestion)
                .voteType(VoteType.YES)
                .votedAt(LocalDateTime.now())
                .build();

        when(voteRepository.save(any(Vote.class))).thenReturn(savedVote);

        VoteResponse response = voteService.castVote(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(500L);
        assertThat(response.getVoteType()).isEqualTo(VoteType.YES);
        assertThat(response.getUserDisplayName()).isEqualTo("Alice");
        assertThat(response.getMovieTitle()).isEqualTo("Fight Club");
        verify(voteRepository).save(any(Vote.class));
    }

    @Test
    public void testCastVote_SkipVote_Success() {
        CastVoteRequest request = CastVoteRequest.builder()
                .userId(10L)
                .movieSuggestionId(100L)
                .voteType(VoteType.SKIP)
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(movieSuggestionRepository.findById(100L)).thenReturn(Optional.of(movieSuggestion));
        when(voteRepository.existsByUserIdAndMovieSuggestionId(10L, 100L)).thenReturn(false);

        Vote savedVote = Vote.builder()
                .id(501L)
                .session(session)
                .user(user)
                .movieSuggestion(movieSuggestion)
                .voteType(VoteType.SKIP)
                .votedAt(LocalDateTime.now())
                .build();

        when(voteRepository.save(any(Vote.class))).thenReturn(savedVote);

        VoteResponse response = voteService.castVote(1L, request);

        assertThat(response.getVoteType()).isEqualTo(VoteType.SKIP);
    }

    @Test
    public void testCastVote_InvalidSessionState_ThrowsException() {
        session.setStatus(SessionStatus.WAITING);
        CastVoteRequest request = CastVoteRequest.builder()
                .userId(10L)
                .movieSuggestionId(100L)
                .voteType(VoteType.YES)
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> voteService.castVote(1L, request))
                .isInstanceOf(InvalidSessionStateException.class)
                .hasMessageContaining("Cannot cast votes when session is in WAITING status");
    }

    @Test
    public void testCastVote_DuplicateVote_ThrowsException() {
        CastVoteRequest request = CastVoteRequest.builder()
                .userId(10L)
                .movieSuggestionId(100L)
                .voteType(VoteType.YES)
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(movieSuggestionRepository.findById(100L)).thenReturn(Optional.of(movieSuggestion));
        when(voteRepository.existsByUserIdAndMovieSuggestionId(10L, 100L)).thenReturn(true);

        assertThatThrownBy(() -> voteService.castVote(1L, request))
                .isInstanceOf(DuplicateVoteException.class)
                .hasMessageContaining("already voted on movie");

        verify(voteRepository, never()).save(any(Vote.class));
    }

    @Test
    public void testGetVotingProgress_Success() {
        User user2 = User.builder().id(11L).session(session).displayName("Bob").build();
        MovieSuggestion movie2 = MovieSuggestion.builder().id(101L).session(session).build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(movieSuggestionRepository.findBySessionId(1L)).thenReturn(List.of(movieSuggestion, movie2));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(user, user2));

        when(voteRepository.countVotesGroupedByUserId(1L)).thenReturn(List.of(
                new Object[]{10L, 2L}, // Alice completed 2/2
                new Object[]{11L, 1L}  // Bob completed 1/2
        ));

        VotingProgressResponse progress = voteService.getVotingProgress(1L);

        assertThat(progress).isNotNull();
        assertThat(progress.getTotalMovies()).isEqualTo(2);
        assertThat(progress.getTotalUsers()).isEqualTo(2);
        assertThat(progress.getCompletedUserCount()).isEqualTo(1);
        assertThat(progress.isAllUsersCompleted()).isFalse();
        assertThat(progress.getUsers()).hasSize(2);
        assertThat(progress.getUsers().get(0).isCompleted()).isTrue();
        assertThat(progress.getUsers().get(1).isCompleted()).isFalse();
    }

    @Test
    public void testCastVoteAndBroadcast_AllUsersCompleted_CalculatesResults() {
        CastVoteRequest request = CastVoteRequest.builder()
                .userId(10L)
                .movieSuggestionId(100L)
                .voteType(VoteType.YES)
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(movieSuggestionRepository.findById(100L)).thenReturn(Optional.of(movieSuggestion));
        when(voteRepository.existsByUserIdAndMovieSuggestionId(10L, 100L)).thenReturn(false);

        Vote savedVote = Vote.builder()
                .id(500L)
                .session(session)
                .user(user)
                .movieSuggestion(movieSuggestion)
                .voteType(VoteType.YES)
                .votedAt(LocalDateTime.now())
                .build();

        when(voteRepository.save(any(Vote.class))).thenReturn(savedVote);
        when(movieSuggestionRepository.findBySessionId(1L)).thenReturn(List.of(movieSuggestion));
        when(userRepository.findBySessionId(1L)).thenReturn(List.of(user));
        when(voteRepository.countVotesGroupedByUserId(1L)).thenReturn(List.<Object[]>of(new Object[]{10L, 1L}));

        VoteResponse response = voteService.castVoteAndBroadcast(1L, request);

        assertThat(response).isNotNull();
        verify(roomEventPublisher).publishVoteProgress(eq("SWIPE1"), any());
        verify(consensusService).calculateResults(1L);
        verify(roomEventPublisher).publishResults(eq("SWIPE1"), any());
    }
}
