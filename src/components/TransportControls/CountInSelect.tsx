'use client';

import { usePlaybackStore } from '@/state/playbackStore';

interface CountInSelectProps {
  className?: string;
}

export function CountInSelect({ className = '' }: CountInSelectProps) {
  const { countInBars, setCountInBars } = usePlaybackStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountInBars(Number(e.target.value));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="count-in" className="text-sm text-gray-600 whitespace-nowrap">
        Count-in
      </label>
      <select
        id="count-in"
        value={countInBars}
        onChange={handleChange}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={0}>Off</option>
        <option value={1}>1 bar</option>
        <option value={2}>2 bars</option>
        <option value={3}>3 bars</option>
        <option value={4}>4 bars</option>
      </select>
    </div>
  );
}
