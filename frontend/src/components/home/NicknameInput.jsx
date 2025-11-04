export default function NicknameInput({ onNicknameChange }) {
  return (
    <input
      type="text"
      placeholder="Enter your Nickname"
      className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
      onChange={(e) => onNicknameChange && onNicknameChange(e.target.value)}
    />
  );
}