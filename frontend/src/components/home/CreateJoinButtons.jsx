import { useNavigate } from 'react-router-dom';
import { useRoom } from '../../context/RoomContext';
import NicknameInput from './NicknameInput';
import { useState } from 'react';

export default function CreateJoinButtons() {
  const navigate = useNavigate();
  const { roomCode, regenerateCode } = useRoom();
  const [nickname, setNickname] = useState('');
  const [showError, setShowError] = useState(false); // Only add this line

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      setShowError(true); // Only change this line
      return;
    }
    setShowError(false); // Add this line
    regenerateCode();
    navigate(`/lobby/${roomCode}`);
  };

  const handleJoinRoom = () => {
    navigate('/join');
  };

  return (
    <>
      <NicknameInput onNicknameChange={setNickname} />
      {/* Only add these 2 lines below NicknameInput */}
      {showError && (
        <p className="text-red-500 text-sm mt-1">Please enter a nickname</p>
      )}
      <div className="flex flex-col items-center space-y-3 w-full max-w-sm mt-2">
        <button
          onClick={handleCreateRoom}
          className="bg-yellow-400 hover:bg-yellow-500 w-full py-2 font-semibold rounded-md shadow-md transition duration-200"
        >
          Create Room
        </button>

        <p className="text-sm text-gray-500">or</p>

        <button
          onClick={handleJoinRoom}
          className="bg-yellow-400 hover:bg-yellow-500 w-full py-2 font-semibold rounded-md shadow-md transition duration-200"
        >
          Join Room
        </button>
      </div>
    </>
  );
}