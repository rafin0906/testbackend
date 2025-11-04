import { useNavigate } from 'react-router-dom';

export default function StartButton() {

  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/game")
  }
  

  return (
    <button className="mt-4 bg-yellow-400 hover:bg-yellow-500 py-2 px-8 rounded-md shadow-md font-bold text-black font-[Sunflower] transition" onClick={handleStart}>
      Start Game
    </button>
  );
}
