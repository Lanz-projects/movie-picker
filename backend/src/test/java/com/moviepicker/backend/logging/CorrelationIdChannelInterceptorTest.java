package com.moviepicker.backend.logging;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class CorrelationIdChannelInterceptorTest {

    private CorrelationIdChannelInterceptor interceptor;
    private MessageChannel mockChannel;

    @BeforeEach
    void setUp() {
        interceptor = new CorrelationIdChannelInterceptor();
        mockChannel = mock(MessageChannel.class);
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    @DisplayName("Should extract native X-Correlation-ID header from STOMP frame and inject into MDC")
    void testExtractsNativeCorrelationIdHeader() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setNativeHeader(CorrelationIdChannelInterceptor.CORRELATION_ID_HEADER, "ws-trace-999");
        accessor.setSessionAttributes(new HashMap<>());

        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(message, mockChannel);

        assertThat(MDC.get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY)).isEqualTo("ws-trace-999");
        assertThat(accessor.getSessionAttributes().get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY)).isEqualTo("ws-trace-999");

        interceptor.afterSendCompletion(message, mockChannel, true, null);
        assertThat(MDC.get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY)).isNull();
    }

    @Test
    @DisplayName("Should extract traceId from session attributes if native header is missing")
    void testExtractsFromSessionAttributes() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        Map<String, Object> sessionAttributes = new HashMap<>();
        sessionAttributes.put(CorrelationIdChannelInterceptor.MDC_TRACE_KEY, "session-inherited-trace");
        accessor.setSessionAttributes(sessionAttributes);

        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(message, mockChannel);

        assertThat(MDC.get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY)).isEqualTo("session-inherited-trace");

        interceptor.afterSendCompletion(message, mockChannel, true, null);
        assertThat(MDC.get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY)).isNull();
    }

    @Test
    @DisplayName("Should generate new UUID traceId when header and session attributes are missing")
    void testGeneratesNewTraceIdWhenMissing() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setSessionAttributes(new HashMap<>());

        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(message, mockChannel);

        String generated = MDC.get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY);
        assertThat(generated).isNotNull().isNotBlank();
        assertThat(accessor.getSessionAttributes().get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY)).isEqualTo(generated);

        interceptor.afterSendCompletion(message, mockChannel, true, null);
        assertThat(MDC.get(CorrelationIdChannelInterceptor.MDC_TRACE_KEY)).isNull();
    }
}
