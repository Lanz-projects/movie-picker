"use client";

import * as React from "react";
import { useSession } from "@/context/SessionContext";

export function AriaLiveRegion() {
  const { stage, session, submissionProgress, error, kickedNotice } = useSession();
  const [announcement, setAnnouncement] = React.useState<string>("");

  const prevStageRef = React.useRef(stage);
  const prevUsersCountRef = React.useRef(session?.users?.length ?? 0);
  const prevSubmittedCountRef = React.useRef(submissionProgress?.submittedCount ?? 0);

  // Announce Stage Transitions
  React.useEffect(() => {
    if (prevStageRef.current !== stage) {
      prevStageRef.current = stage;
      let stageName = "";
      switch (stage) {
        case "SETUP":
          stageName = "Room setup phase.";
          break;
        case "LOBBY":
          stageName = `Joined room ${session?.roomCode || ""}. Waiting for players to get ready.`;
          break;
        case "SEARCH":
          stageName = "Movie nominations phase started. Browse or ask AI to pick your movies.";
          break;
        case "SWIPER":
          stageName = "Voting phase started. Swipe right to like, left to pass, or up to superlike.";
          break;
        case "WINNER":
          stageName = "Voting concluded. The winning movie has been decided!";
          break;
      }
      if (stageName) {
        setAnnouncement(stageName);
      }
    }
  }, [stage, session?.roomCode]);

  // Announce User Join / Leave
  React.useEffect(() => {
    const currentCount = session?.users?.length ?? 0;
    if (prevUsersCountRef.current !== currentCount && prevUsersCountRef.current > 0) {
      const diff = currentCount - prevUsersCountRef.current;
      prevUsersCountRef.current = currentCount;
      if (diff > 0) {
        const latestUser = session?.users?.[session.users.length - 1];
        setAnnouncement(`${latestUser?.displayName || "A new player"} joined the room.`);
      } else {
        setAnnouncement("A player left the room.");
      }
    } else {
      prevUsersCountRef.current = currentCount;
    }
  }, [session?.users]);

  // Announce Deck Submissions
  React.useEffect(() => {
    const submitted = submissionProgress?.submittedCount ?? 0;
    const total = submissionProgress?.totalCount ?? 0;
    if (stage === "SEARCH" && submitted > prevSubmittedCountRef.current && total > 0) {
      prevSubmittedCountRef.current = submitted;
      setAnnouncement(`${submitted} of ${total} players have submitted their movies.`);
    }
  }, [stage, submissionProgress]);

  // Announce Errors / Kick Notice
  React.useEffect(() => {
    if (error) {
      setAnnouncement(`Error: ${error}`);
    }
  }, [error]);

  React.useEffect(() => {
    if (kickedNotice) {
      setAnnouncement(`Notice: ${kickedNotice}`);
    }
  }, [kickedNotice]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
