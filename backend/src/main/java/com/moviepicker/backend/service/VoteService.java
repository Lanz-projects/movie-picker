package com.moviepicker.backend.service;

import com.moviepicker.backend.dto.CastVoteRequest;
import com.moviepicker.backend.dto.VoteResponse;
import com.moviepicker.backend.dto.VotingProgressResponse;

public interface VoteService {

    VoteResponse castVote(Long sessionId, CastVoteRequest request);

    VoteResponse castVoteAndBroadcast(Long sessionId, CastVoteRequest request);

    VoteResponse castVoteAndBroadcastByRoomCode(String roomCode, CastVoteRequest request);

    VotingProgressResponse getVotingProgress(Long sessionId);

    VotingProgressResponse getVotingProgressByRoomCode(String roomCode);
}
