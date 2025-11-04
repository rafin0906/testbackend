import { MdContentCopy } from 'react-icons/md';
import { useRoom } from '../../context/RoomContext';

export default function RoomCodeBox() {
  const { roomCode } = useRoom();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="bg-white px-6 py-4 rounded-lg shadow-md text-center">
      <p className="text-sm text-gray-600">Room Code</p>
      <div className="flex items-center justify-center gap-2 mt-1">
        <p className="font-bold text-lg tracking-widest">{roomCode}</p>
        <button onClick={copyToClipboard}>
          <MdContentCopy className="text-blue-600 cursor-pointer hover:text-blue-800" size={20} />
        </button>
      </div>
    </div>
  );
}
