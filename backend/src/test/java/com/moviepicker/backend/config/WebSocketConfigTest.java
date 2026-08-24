package com.moviepicker.backend.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class WebSocketConfigTest {

    @LocalServerPort
    private int port;

    private WebSocketStompClient nativeStompClient;
    private WebSocketStompClient sockJsStompClient;

    @BeforeEach
    public void setUp() {
        nativeStompClient = new WebSocketStompClient(new StandardWebSocketClient());
        nativeStompClient.setMessageConverter(new StringMessageConverter());

        List<Transport> transports = Collections.singletonList(new WebSocketTransport(new StandardWebSocketClient()));
        sockJsStompClient = new WebSocketStompClient(new SockJsClient(transports));
        sockJsStompClient.setMessageConverter(new StringMessageConverter());
    }

    @AfterEach
    public void tearDown() {
        if (nativeStompClient != null && nativeStompClient.isRunning()) {
            nativeStompClient.stop();
        }
        if (sockJsStompClient != null && sockJsStompClient.isRunning()) {
            sockJsStompClient.stop();
        }
    }

    @Test
    public void testNativeWebSocketConnection_Success() throws Exception {
        String url = String.format("ws://localhost:%d/ws", port);

        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        nativeStompClient.connectAsync(url, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, org.springframework.messaging.simp.stomp.StompHeaders connectedHeaders) {
                sessionFuture.complete(session);
            }
        });

        StompSession session = sessionFuture.get(5, TimeUnit.SECONDS);

        assertThat(session).isNotNull();
        assertThat(session.isConnected()).isTrue();
        session.disconnect();
    }

    @Test
    public void testSockJsConnection_Success() throws Exception {
        String url = String.format("http://localhost:%d/ws", port);

        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        sockJsStompClient.connectAsync(url, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, org.springframework.messaging.simp.stomp.StompHeaders connectedHeaders) {
                sessionFuture.complete(session);
            }
        });

        StompSession session = sessionFuture.get(5, TimeUnit.SECONDS);

        assertThat(session).isNotNull();
        assertThat(session.isConnected()).isTrue();
        session.disconnect();
    }
}
