import demo1 from '../../assets/demo_profile/demo1.png';
import demo2 from '../../assets/demo_profile/demo2.png';
import demo3 from '../../assets/demo_profile/demo3.png';
import demo4 from '../../assets/demo_profile/demo4.png';

const players = [
  { name: "Rafin (Host)", image: demo1 },
  { name: "Piash", image: demo2 },
  { name: "Mahi", image: demo3 },
  { name: "Mim", image: demo4 },
];

export default function PlayerList() {
  return (
    <div className="space-y-2">
      {players.map((player, idx) => (
        <div
          key={player.name}
          className="flex items-center space-x-3 px-4 py-2 bg-yellow-100 rounded-md w-[240px] shadow-sm"
        >
          {/* ✅ Profile image */}
          <img
            src={player.image}
            alt={player.name}
            className="w-8 h-8 rounded-full object-cover"
          />

          {/* ✅ Player name */}
          <p className="text-sm font-[Sunflower]">
            {idx + 1}. {player.name}
          </p>
        </div>
      ))}
    </div>
  );
}
