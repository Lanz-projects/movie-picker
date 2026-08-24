package com.moviepicker.backend.dto;

public enum RoomEventType {
    // Roster & Presence
    USER_JOINED,
    USER_LEFT,
    USER_KICKED,
    HOST_CHANGED,

    // Stage Transitions & Progression
    STAGE_CHANGED,
    DECK_SUBMITTED,

    // Voting & Consensus
    VOTE_CAST,
    USER_COMPLETED,
    ALL_VOTING_COMPLETED
}

