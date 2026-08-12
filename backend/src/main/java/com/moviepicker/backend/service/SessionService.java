package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.CreateSessionRequest;
import com.moviepicker.backend.dto.JoinSessionRequest;
import com.moviepicker.backend.dto.SessionResponse;
import com.moviepicker.backend.dto.UpdateSessionStatusRequest;

public interface SessionService {
    SessionResponse createSession(CreateSessionRequest request);
    SessionResponse getSessionByRoomCode(String roomCode);
    SessionResponse joinSession(JoinSessionRequest request);
    SessionResponse updateSessionStatus(String roomCode, UpdateSessionStatusRequest request);
}
