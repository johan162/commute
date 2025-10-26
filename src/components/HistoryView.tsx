
import React from 'react';
import { Card } from './Card';
import type { CommuteRecord } from '../types.ts';

interface HistoryViewProps {
  records: CommuteRecord[];
  median?: number;
}

const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', `${s}s`].filter(Boolean).join(' ') || '0s';
};

const getBarColor = (duration: number, median: number): string => {
    if (!median || median === 0) return 'hsl(210, 15%, 50%)'; // Neutral gray

    // Define the range for color scaling, e.g., 50% faster to 50% slower than median.
    const lowerBound = median * 0.5;
    const upperBound = median * 1.5;

    const clampedDuration = Math.max(lowerBound, Math.min(upperBound, duration));

    // Map duration from [lowerBound, upperBound] to a hue from [120 (green), 0 (red)]
    const ratio = (clampedDuration - lowerBound) / (upperBound - lowerBound);
    const hue = 120 - (ratio * 120);

    return `hsl(${hue}, 70%, 45%)`;
};

const HistoryItem: React.FC<{ record: CommuteRecord; median?: number }> = ({ record, median }) => {
    const barColor = median ? getBarColor(record.duration, median) : 'hsl(210, 15%, 50%)';

    return (
        <li className="py-4 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-700/50 rounded-lg transition-colors duration-200">
            <div className="flex-1 mb-2 sm:mb-0 pr-4">
                <p className="font-semibold text-gray-200">{formatDuration(record.duration)}</p>
                <p className="text-xs text-gray-400">{new Date(record.date).toLocaleString('en-GB', { hour12: false })}</p>
            </div>
            <div className="w-full sm:w-1/2 h-2.5 bg-gray-600 rounded-full overflow-hidden" title={`Comparison to median commute time`}>
                <div className="h-full rounded-full" style={{ backgroundColor: barColor, width: '100%' }}></div>
            </div>
        </li>
    );
};

export const HistoryView: React.FC<HistoryViewProps> = ({ records, median }) => {
  if (records.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">No History Yet</h2>
          <p className="text-gray-400">Your completed commutes will appear here.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Commute History">
      <div className="max-h-[70vh] overflow-y-auto">
        <ul className="divide-y divide-gray-700">
          {records.map(record => (
            <HistoryItem key={record.id} record={record} median={median} />
          ))}
        </ul>
      </div>
    </Card>
  );
};