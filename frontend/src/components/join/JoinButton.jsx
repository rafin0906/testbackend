import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function JoinButton({ roomCode }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!roomCode.trim()) {
      setError('Please enter a valid room code before joining!');
      return;
    }

    setError('');
    navigate(`/lobby/${roomCode}`);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Validation Message */}
      {error && (
        <div className="text-red-600 text-sm  mb-2 font-[Sunflower]">
          {error}
        </div>
      )}

      <button
        className="w-[240px] mt-3 py-2 rounded-md bg-yellow-400 text-black font-bold shadow-md hover:bg-yellow-500 transition-all font-[Sunflower]"
        onClick={handleJoin}
      >
        Join
      </button>
    </div>
  );
}
