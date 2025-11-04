// src/components/gamepage/LeaderBoard.jsx
import React from 'react';

const scoreData = [
  [1000, 800, 0, 600],
  [0, 0, 0, 1000],
  [0, 800, 400, 600],
  [0, 0, 1000, 0],
  [600, 800, 0, 600],
  [0, 0, 1000, 600],
  [600, 800, 0, 400],
  [1000, 0, 800, 0],
  [1000, 1000, 800, 0],
  [600, 800, 1000, 600],
];

const LeaderBoard = () => {
  const players = ['Rafin', 'Piash', 'Mahi', 'Mim'];

  return (
    <div className="max-w-4xl mx-auto my-6">
      {/* Bangla title with Bangla font */}
      <div
        className="bg-yellow-400 text-black text-center py-2  rounded-md mb-4"
        style={{
          fontFamily: 'LipighorBangla',
          fontSize: '1.5rem',
        }}
      >
        wjWvi‡evW©
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-center">
          <thead className="bg-gray-100">
            <tr style={{ fontFamily: 'Sunflower' }}>
              <th className="border px-4 py-2">Round</th>
              {players.map((player) => (
                <th key={player} className="border px-4 py-2">
                  {player}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ fontFamily: 'Sunflower' }}>
            {scoreData.map((row, index) => (
              <tr key={index}>
                <td className="border px-4 py-2 font-semibold">{index + 1}.</td>
                {row.map((score, i) => (
                  <td key={i} className="border px-4 py-2">
                    {score}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderBoard;
