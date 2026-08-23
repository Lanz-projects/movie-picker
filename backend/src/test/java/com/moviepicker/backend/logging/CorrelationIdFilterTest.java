package com.moviepicker.backend.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class CorrelationIdFilterTest {

    private CorrelationIdFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CorrelationIdFilter();
        MDC.clear();
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    @DisplayName("Should extract existing X-Correlation-ID and propagate to MDC and response")
    void testExtractsExistingCorrelationId() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(CorrelationIdFilter.CORRELATION_ID_HEADER, "custom-trace-12345");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcValueDuringExecution = new AtomicReference<>();
        FilterChain chain = (req, res) -> mdcValueDuringExecution.set(MDC.get(CorrelationIdFilter.MDC_TRACE_KEY));

        filter.doFilterInternal(request, response, chain);

        assertThat(mdcValueDuringExecution.get()).isEqualTo("custom-trace-12345");
        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo("custom-trace-12345");
        assertThat(MDC.get(CorrelationIdFilter.MDC_TRACE_KEY)).isNull();
    }

    @Test
    @DisplayName("Should extract existing X-Trace-ID if X-Correlation-ID is missing")
    void testExtractsExistingTraceIdHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(CorrelationIdFilter.TRACE_ID_HEADER, "trace-id-abc");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcValueDuringExecution = new AtomicReference<>();
        FilterChain chain = (req, res) -> mdcValueDuringExecution.set(MDC.get(CorrelationIdFilter.MDC_TRACE_KEY));

        filter.doFilterInternal(request, response, chain);

        assertThat(mdcValueDuringExecution.get()).isEqualTo("trace-id-abc");
        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo("trace-id-abc");
        assertThat(MDC.get(CorrelationIdFilter.MDC_TRACE_KEY)).isNull();
    }

    @Test
    @DisplayName("Should generate a new UUID if no correlation header is provided")
    void testGeneratesNewUuidWhenHeaderMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcValueDuringExecution = new AtomicReference<>();
        FilterChain chain = (req, res) -> mdcValueDuringExecution.set(MDC.get(CorrelationIdFilter.MDC_TRACE_KEY));

        filter.doFilterInternal(request, response, chain);

        String generatedTraceId = mdcValueDuringExecution.get();
        assertThat(generatedTraceId).isNotNull().isNotBlank();
        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo(generatedTraceId);
        assertThat(MDC.get(CorrelationIdFilter.MDC_TRACE_KEY)).isNull();
    }
}
