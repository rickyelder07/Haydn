'use client';

interface MidiDeviceListProps {
  devices: string[];
}

export function MidiDeviceList({ devices }: MidiDeviceListProps) {
  if (devices.length === 0) {
    return (
      <p className="text-xs text-secondary px-2 py-1">No devices found</p>
    );
  }
  return (
    <ul className="py-1">
      {devices.map((name, i) => (
        <li key={i} className="px-3 py-1 text-xs text-primary flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          {name}
        </li>
      ))}
    </ul>
  );
}
