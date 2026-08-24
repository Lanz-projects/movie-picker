package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.*;

public interface SessionService {
    SessionResponse createSession(CreateSessionRequest request);
    SessionResponse getSessionByRoomCode(String roomCode);
    SessionResponse joinSession(JoinSessionRequest request);
    SessionResponse updateSessionStatus(String roomCode, UpdateSessionStatusRequest request);
    LeaveSessionResponse leaveSession(Long sessionId, LeaveSessionRequest request);
    LeaveSessionResponse leaveSessionByRoomCode(String roomCode, LeaveSessionRequest request);
    LeaveSessionResponse kickUser(String roomCode, KickUserRequest request);
}
