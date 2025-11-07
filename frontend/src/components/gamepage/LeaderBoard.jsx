import React from "react";
import { usePlayers } from "../../context/PlayerContext";
import { useRoom } from "../../context/RoomContext";

/**
 * roundsHistory: [
 *   [{ userId: "606...", points: 100 }, ...], // round 1 scores
 *   [{ userId: "606...", points: 0 }, ...],   // round 2 scores
 *   ...
 * ]
 *
 * Players order comes from PlayerContext (4 slots).
 * totalRounds is taken from room?.totalRounds || selectedRounds (RoomContext).
 */

const LeaderBoard = ({ roundsHistory = [] }) => {
  const { players } = usePlayers();
  const { room, selectedRounds } = useRoom();

  // player display names (4 columns)
  const playerList = Array.isArray(players) && players.length === 4 ? players : [
    { id: "", name: "Waiting 1" },
    { id: "", name: "Waiting 2" },
    { id: "", name: "Waiting 3" },
    { id: "", name: "Waiting 4" },
  ];

  const totalRounds = (room && room.totalRounds) || selectedRounds || roundsHistory.length || 0;
  const rowsCount = Math.max(totalRounds, roundsHistory.length);

  // helper to get points for a given round index and player id
  const getPointsFor = (roundIdx, playerId) => {
    const round = roundsHistory[roundIdx];
    if (!Array.isArray(round)) return "-";
    const entry = round.find((r) => String(r.userId) === String(playerId));
    return entry ? entry.points : 0;
  };

  return (
    <div className="max-w-4xl mx-auto my-6">
      <div
        className="bg-yellow-400 text-black text-center py-2 rounded-md mb-4"
        style={{
          fontFamily: "LipighorBangla",
          fontSize: "1.25rem",
        }}
      >
        wjWvi‡evW©
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-center">
          <thead className="bg-gray-100">
            <tr style={{ fontFamily: "Sunflower" }}>
              <th className="border px-4 py-2">Round</th>
              {playerList.map((p, idx) => (
                <th key={idx} className="border px-4 py-2">
                  {p.name || `Player ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ fontFamily: "Sunflower" }}>
            {Array.from({ length: rowsCount }).map((_, rIdx) => (
              <tr key={rIdx}>
                <td className="border px-4 py-2 font-semibold">{rIdx + 1}.</td>
                {playerList.map((p, i) => (
                  <td key={i} className="border px-4 py-2">
                    {getPointsFor(rIdx, p.id)}
                  </td>
                ))}
              </tr>
            ))}
            {rowsCount === 0 && (
              <tr>
                <td colSpan={5} className="border px-4 py-6 text-gray-500">
                  No rounds yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderBoard;
