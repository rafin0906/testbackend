
import { useEffect, useRef, useState } from "react";
import { useRoom } from "../../context/RoomContext";

export default function Timer({
  start = 15,         // round duration in seconds
  breakDuration = 5,  // intermission duration in seconds
}) {
  const { room, setRoom } = useRoom();

  const totalRounds = Number.isFinite(room?.totalRounds) ? room.totalRounds : null;
  const currentRound = Number.isFinite(room?.currentRound) ? room.currentRound : 0;
  const gameInProgress = room?.gameStatus === "in_progress";

  const [phase, setPhase] = useState("idle"); // "idle" | "running" | "break" | "done"
  const [timeLeft, setTimeLeft] = useState(start);
  const intervalRef = useRef(null);

  // Ensure we have a safe setter for currentRound in RoomContext
  const setCurrentRound = (next) => {
    setRoom((prev) => (prev ? { ...prev, currentRound: next } : prev));
  };

  // Initialize first round when game starts
  useEffect(() => {
    if (!gameInProgress || !totalRounds) {
      // reset if game not started
      setPhase("idle");
      setTimeLeft(start);
      return;
    }

    // If server hasn't set round yet, begin from 1
    if (!currentRound || currentRound < 1) {
      setCurrentRound(1);
      // phase/running will be set by next effect below
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameInProgress, totalRounds]);

  // Whenever currentRound changes (from us or server), (re)start the round timer
  useEffect(() => {
    if (!gameInProgress || !totalRounds) return;

    if (currentRound >= 1 && currentRound <= totalRounds) {
      setPhase("running");
      setTimeLeft(start);
    } else if (currentRound > totalRounds) {
      setPhase("done");
      setTimeLeft(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, gameInProgress, totalRounds, start]);

  // Ticking effect for the active phase
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (phase === "idle" || phase === "done") return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);

  // Transition logic when timeLeft hits 0
  useEffect(() => {
    if (phase === "running" && timeLeft <= 0) {
      // Round finished -> go to break
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setPhase("break");
      setTimeLeft(breakDuration);
      return;
    }

    if (phase === "break" && timeLeft <= 0) {
      // Break finished -> either next round or done
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (totalRounds && currentRound < totalRounds) {
        setCurrentRound(currentRound + 1); // this will kick off next "running" phase
      } else {
        setPhase("done");
        setTimeLeft(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const label =
    !gameInProgress
      ? "Waiting"
      : phase === "running"
        ? "Round time"
        : phase === "break"
          ? "Intermission"
          : "Finished";

  return (
    <div className="text-center text-gray-800 text-xl font-semibold my-4" style={{ fontFamily: "Sunflower" }}>
      <div className="mb-1 text-sm text-gray-600">
        {gameInProgress && totalRounds ? (
          <span>Round {Math.min(Math.max(currentRound || 0, 0), totalRounds)} / {totalRounds}</span>
        ) : (
          <span>Waiting for round</span>
        )}
      </div>

      <div className="inline-flex items-baseline space-x-2">
        <div className="text-sm text-gray-600">{label}:</div>
        <div className="text-3xl font-bold">{Math.max(0, timeLeft)}</div>
        <div className="text-sm text-gray-600">seconds</div>
      </div>
    </div>
  );
}
