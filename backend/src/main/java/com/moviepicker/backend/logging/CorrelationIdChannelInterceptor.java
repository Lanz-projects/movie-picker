package com.moviepicker.backend.logging;

import org.slf4j.MDC;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.UUID;

/**
 * ChannelInterceptor for STOMP WebSocket messages that propagates correlation IDs into MDC.
 * Extracts 'X-Correlation-ID' from native STOMP headers or session attributes, or generates a UUID.
 * Cleans up MDC after message processing to avoid thread pool leakage.
 */
@Component
public class CorrelationIdChannelInterceptor implements ChannelInterceptor {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    public static final String TRACE_ID_HEADER = "X-Trace-ID";
    public static final String MDC_TRACE_KEY = "traceId";

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            accessor = StompHeaderAccessor.wrap(message);
        }

        String correlationId = extractCorrelationId(accessor);
        MDC.put(MDC_TRACE_KEY, correlationId);

        // Store in session attributes for subsequent message correlation
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put(MDC_TRACE_KEY, correlationId);
        }

        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        MDC.remove(MDC_TRACE_KEY);
    }

    private String extractCorrelationId(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader(CORRELATION_ID_HEADER);
        if (StringUtils.hasText(header)) {
            return header.trim();
        }

        header = accessor.getFirstNativeHeader(TRACE_ID_HEADER);
        if (StringUtils.hasText(header)) {
            return header.trim();
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null && sessionAttributes.containsKey(MDC_TRACE_KEY)) {
            Object sessionTraceId = sessionAttributes.get(MDC_TRACE_KEY);
            if (sessionTraceId != null && StringUtils.hasText(sessionTraceId.toString())) {
                return sessionTraceId.toString();
            }
        }

        return UUID.randomUUID().toString();
    }
}
