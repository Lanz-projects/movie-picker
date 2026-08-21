package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.SessionResultsResponse;
import com.moviepicker.backend.dto.VoteMessageDto;
import com.moviepicker.backend.model.*;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.repository.VoteRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class ConsensusWebSocketTest {

    @LocalServerPort
    private int port;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieSuggestionRepository movieSuggestionRepository;

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private ConsensusController consensusController;

    private WebSocketStompClient stompClient;
    private Session testSession;
    private User testUser;
    private MovieSuggestion testMovie;

    @BeforeEach
    public void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new JacksonJsonMessageConverter());

        voteRepository.deleteAll();
        movieSuggestionRepository.deleteAll();
        userRepository.deleteAll();
        sessionRepository.deleteAll();

        testSession = Session.builder()
                .roomCode("AUTOWIN")
                .hostName("Alice")
                .status(SessionStatus.VOTING)
                .maxUsers(5)
                .maxSuggestionsPerUser(3)
                .createdAt(LocalDateTime.now())
                .build();
        testSession = sessionRepository.save(testSession);

        testUser = User.builder()
                .session(testSession)
                .displayName("Alice")
                .joinedAt(LocalDateTime.now())
                .build();
        testUser = userRepository.save(testUser);

        testMovie = MovieSuggestion.builder()
                .session(testSession)
                .user(testUser)
                .tmdbId(550L)
                .title("Fight Club")
                .releaseYear(1999)
                .suggestedAt(LocalDateTime.now())
                .build();
        testMovie = movieSuggestionRepository.save(testMovie);
    }

    @AfterEach
    public void tearDown() {
        if (stompClient != null && stompClient.isRunning()) {
            stompClient.stop();
        }
        voteRepository.deleteAll();
        movieSuggestionRepository.deleteAll();
        userRepository.deleteAll();
        sessionRepository.deleteAll();
    }

    @Test
    public void testAutoTriggerConsensusOnFinalVote() throws Exception {
        String url = String.format("ws://localhost:%d/ws", port);

        CompletableFuture<StompSession> connectFuture = new CompletableFuture<>();
        stompClient.connectAsync(url, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                connectFuture.complete(session);
            }
        });

        StompSession stompSession = connectFuture.get(5, TimeUnit.SECONDS);
        assertThat(stompSession.isConnected()).isTrue();

        CompletableFuture<SessionResultsResponse> resultsFuture = new CompletableFuture<>();
        stompSession.subscribe("/topic/room/AUTOWIN/results", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return SessionResultsResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                resultsFuture.complete((SessionResultsResponse) payload);
            }
        });

        // Give subscription a moment to register
        Thread.sleep(300);

        VoteMessageDto voteMessage = VoteMessageDto.builder()
                .roomCode("AUTOWIN")
                .userId(testUser.getId())
                .movieSuggestionId(testMovie.getId())
                .voteType(VoteType.YES)
                .build();

        stompSession.send("/app/vote", voteMessage);

        SessionResultsResponse receivedResults = resultsFuture.get(5, TimeUnit.SECONDS);

        assertThat(receivedResults).isNotNull();
        assertThat(receivedResults.getRoomCode()).isEqualTo("AUTOWIN");
        assertThat(receivedResults.getWinner()).isNotNull();
        assertThat(receivedResults.getWinner().getTitle()).isEqualTo("Fight Club");
        assertThat(receivedResults.getWinner().getScore()).isEqualTo(1);
        assertThat(receivedResults.getWinner().isUnanimous()).isTrue();
        assertThat(receivedResults.getRankedMovies()).hasSize(1);

        // Verify session transitioned to COMPLETED in database (polling with short timeout for async transaction commit)
        Session updatedSession = null;
        for (int i = 0; i < 20; i++) {
            updatedSession = sessionRepository.findById(testSession.getId()).orElse(null);
            if (updatedSession != null && updatedSession.getStatus() == SessionStatus.COMPLETED) {
                break;
            }
            Thread.sleep(50);
        }
        assertThat(updatedSession).isNotNull();
        assertThat(updatedSession.getStatus()).isEqualTo(SessionStatus.COMPLETED);

        stompSession.disconnect();
    }

    @Test
    public void testManualTriggerBroadcastsToWebSocketTopic() throws Exception {
        String url = String.format("ws://localhost:%d/ws", port);

        CompletableFuture<StompSession> connectFuture = new CompletableFuture<>();
        stompClient.connectAsync(url, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                connectFuture.complete(session);
            }
        });

        StompSession stompSession = connectFuture.get(5, TimeUnit.SECONDS);
        assertThat(stompSession.isConnected()).isTrue();

        CompletableFuture<SessionResultsResponse> resultsFuture = new CompletableFuture<>();
        stompSession.subscribe("/topic/room/AUTOWIN/results", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return SessionResultsResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                resultsFuture.complete((SessionResultsResponse) payload);
            }
        });

        Thread.sleep(300);

        // Manually trigger calculate endpoint
        consensusController.calculateResults(testSession.getId());

        SessionResultsResponse receivedResults = resultsFuture.get(5, TimeUnit.SECONDS);

        assertThat(receivedResults).isNotNull();
        assertThat(receivedResults.getRoomCode()).isEqualTo("AUTOWIN");
        assertThat(receivedResults.getWinner()).isNotNull();
        assertThat(receivedResults.getWinner().getTitle()).isEqualTo("Fight Club");

        stompSession.disconnect();
    }
}
