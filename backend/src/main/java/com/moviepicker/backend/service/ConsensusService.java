package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.SessionResultsResponse;

public interface ConsensusService {

    SessionResultsResponse calculateResults(Long sessionId);

    SessionResultsResponse calculateResultsByRoomCode(String roomCode);

    SessionResultsResponse getResults(Long sessionId);

    SessionResultsResponse getResultsByRoomCode(String roomCode);
}
