import demo1 from '../../assets/demo_profile/demo1.png';
import demo2 from '../../assets/demo_profile/demo2.png';
import demo3 from '../../assets/demo_profile/demo3.png';
import demo4 from '../../assets/demo_profile/demo4.png';
import { usePlayers } from '../../context/PlayerContext';

const images = [demo1, demo2, demo3, demo4];

export default function PlayerList() {
  const { players } = usePlayers();

  // players is expected to be an array; keep UI images fixed and show names from context
  return (
    <div className="space-y-2">
      {images.map((img, idx) => {
        const playerName = (players && players[idx] && players[idx].name) || '';
        return (
          <div
            key={idx}
            className="flex items-center space-x-3 px-4 py-2 bg-yellow-100 rounded-md w-[240px] shadow-sm"
          >
            {/* ✅ Profile image */}
            <img
              src={img}
              alt={playerName || `player-${idx + 1}`}
              className="w-8 h-8 rounded-full object-cover"
            />

            {/* ✅ Player name (from context) */}
            <p className="text-sm font-[Sunflower]">
              {idx + 1}. {playerName}
            </p>
          </div>
        );
      })}
    </div>
  );
}
