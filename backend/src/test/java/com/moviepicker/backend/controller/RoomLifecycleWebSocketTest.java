package com.moviepicker.backend.controller;

import com.moviepicker.backend.dto.*;
import com.moviepicker.backend.model.Session;
import com.moviepicker.backend.model.SessionStatus;
import com.moviepicker.backend.model.User;
import com.moviepicker.backend.repository.MovieSuggestionRepository;
import com.moviepicker.backend.repository.SessionRepository;
import com.moviepicker.backend.repository.UserRepository;
import com.moviepicker.backend.repository.VoteRepository;
import com.moviepicker.backend.service.MovieSubmissionService;
import com.moviepicker.backend.service.SessionService;
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
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class RoomLifecycleWebSocketTest {

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
    private SessionService sessionService;

    @Autowired
    private MovieSubmissionService movieSubmissionService;

    private WebSocketStompClient stompClient;
    private Session testSession;
    private User hostUser;

    @BeforeEach
    public void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new JacksonJsonMessageConverter());

        voteRepository.deleteAll();
        movieSuggestionRepository.deleteAll();
        userRepository.deleteAll();
        sessionRepository.deleteAll();

        testSession = Session.builder()
                .roomCode("ROOM99")
                .hostName("Alice")
                .status(SessionStatus.WAITING)
                .maxUsers(5)
                .maxSuggestionsPerUser(3)
                .createdAt(LocalDateTime.now())
                .build();
        testSession = sessionRepository.save(testSession);

        hostUser = User.builder()
                .session(testSession)
                .displayName("Alice")
                .joinedAt(LocalDateTime.now())
                .build();
        hostUser = userRepository.save(hostUser);
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

    private StompSession connectClient() throws Exception {
        String url = String.format("ws://localhost:%d/ws", port);
        CompletableFuture<StompSession> connectFuture = new CompletableFuture<>();
        stompClient.connectAsync(url, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                connectFuture.complete(session);
            }
        });
        return connectFuture.get(5, TimeUnit.SECONDS);
    }

    @Test
    public void testUserJoinedEvent_BroadcastsOnJoinSession() throws Exception {
        StompSession hostWs = connectClient();
        CompletableFuture<RoomProgressEvent> eventFuture = new CompletableFuture<>();

        hostWs.subscribe("/topic/room/ROOM99", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RoomProgressEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                eventFuture.complete((RoomProgressEvent) payload);
            }
        });

        Thread.sleep(300);

        // Guest joins via REST service
        sessionService.joinSession(JoinSessionRequest.builder()
                .roomCode("ROOM99")
                .displayName("Bob")
                .build());

        RoomProgressEvent receivedEvent = eventFuture.get(5, TimeUnit.SECONDS);
        assertThat(receivedEvent).isNotNull();
        assertThat(receivedEvent.getEventType()).isEqualTo(RoomEventType.USER_JOINED);
        assertThat(receivedEvent.getUserDisplayName()).isEqualTo("Bob");
        assertThat(receivedEvent.getUsers()).hasSize(2);
        assertThat(receivedEvent.getUsers().stream().map(UserResponse::getDisplayName))
                .containsExactlyInAnyOrder("Alice", "Bob");

        hostWs.disconnect();
    }

    @Test
    public void testStageChangedEvent_BroadcastsOnStatusUpdate() throws Exception {
        StompSession clientWs = connectClient();
        CompletableFuture<RoomProgressEvent> eventFuture = new CompletableFuture<>();

        clientWs.subscribe("/topic/room/ROOM99", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RoomProgressEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                eventFuture.complete((RoomProgressEvent) payload);
            }
        });

        Thread.sleep(300);

        sessionService.updateSessionStatus("ROOM99", UpdateSessionStatusRequest.builder()
                .status(SessionStatus.VOTING)
                .build());

        RoomProgressEvent receivedEvent = eventFuture.get(5, TimeUnit.SECONDS);
        assertThat(receivedEvent).isNotNull();
        assertThat(receivedEvent.getEventType()).isEqualTo(RoomEventType.STAGE_CHANGED);
        assertThat(receivedEvent.getSessionStatus()).isEqualTo(SessionStatus.VOTING);

        clientWs.disconnect();
    }

    @Test
    public void testDeckSubmittedEvent_BroadcastsOnMovieSubmission() throws Exception {
        StompSession clientWs = connectClient();
        CompletableFuture<RoomProgressEvent> eventFuture = new CompletableFuture<>();

        clientWs.subscribe("/topic/room/ROOM99", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RoomProgressEvent.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                eventFuture.complete((RoomProgressEvent) payload);
            }
        });

        Thread.sleep(300);

        movieSubmissionService.submitMovies(testSession.getId(), SubmitMoviesRequest.builder()
                .userId(hostUser.getId())
                .movies(List.of(MovieSubmissionDto.builder()
                        .tmdbId(101L)
                        .title("The Matrix")
                        .releaseYear(1999)
                        .build()))
                .build());

        RoomProgressEvent receivedEvent = eventFuture.get(5, TimeUnit.SECONDS);
        assertThat(receivedEvent).isNotNull();
        assertThat(receivedEvent.getEventType()).isEqualTo(RoomEventType.DECK_SUBMITTED);
        assertThat(receivedEvent.getUserDisplayName()).isEqualTo("Alice");
        assertThat(receivedEvent.getSubmittedUserCount()).isEqualTo(1);

        clientWs.disconnect();
    }

    @Test
    void testPresenceRegistrationAndDisconnect_PreservesSessionForReconnection() throws Exception {
        sessionService.createSession(CreateSessionRequest.builder()
                .hostName("Alice")
                .maxUsers(5)
                .build());

        Session session = sessionRepository.findAll().get(0);
        session.setRoomCode("ROOM99");
        sessionRepository.save(session);

        sessionService.joinSession(JoinSessionRequest.builder()
                .roomCode("ROOM99")
                .displayName("Charlie")
                .build());

        User charlie = userRepository.findBySessionId(session.getId()).stream()
                .filter(u -> u.getDisplayName().equals("Charlie"))
                .findFirst()
                .orElseThrow();

        // Guest connects WebSocket and registers presence
        StompSession guestWs = connectClient();
        guestWs.send("/app/room/register", UserPresenceDto.builder()
                .roomCode("ROOM99")
                .userId(charlie.getId())
                .displayName("Charlie")
                .build());

        Thread.sleep(400);

        // Guest disconnects abruptly (e.g. page refresh / app backgrounded)
        guestWs.disconnect();
        Thread.sleep(400);

        // Verify Charlie is NOT deleted from DB to allow reattachment on refresh
        assertThat(userRepository.findById(charlie.getId())).isPresent();
    }
}
