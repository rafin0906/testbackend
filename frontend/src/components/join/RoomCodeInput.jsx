export default function RoomCodeInput({ value, onChange }) {
  return (
    <input
      type="text"
      placeholder="Paste Room Code"
      value={value}
      onChange={onChange}
      className="w-[240px] mt-3 px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm font-[Sunflower]"
    />
  );
}
