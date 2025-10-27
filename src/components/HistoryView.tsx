
import React, { useState } from 'react';
import { Card } from './Card';
import type { CommuteRecord } from '../types.ts';

interface HistoryViewProps {
  records: CommuteRecord[];
  median?: number;
  onDeleteRecords: (recordIds: number[]) => void;
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

const HistoryItem: React.FC<{ 
  record: CommuteRecord; 
  median?: number; 
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
}> = ({ record, median, isEditMode, isSelected, onSelect }) => {
    const barColor = median ? getBarColor(record.duration, median) : 'hsl(210, 15%, 50%)';

    return (
        <li className="py-4 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-700/50 rounded-lg transition-colors duration-200">
            {isEditMode && (
                <div className="flex items-center mr-4">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(record.id, e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                </div>
            )}
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

export const HistoryView: React.FC<HistoryViewProps> = ({ records, median, onDeleteRecords }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());

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

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    setSelectedRecords(new Set()); // Clear selections when toggling mode
  };

  const handleRecordSelect = (recordId: number, selected: boolean) => {
    const newSelection = new Set(selectedRecords);
    if (selected) {
      newSelection.add(recordId);
    } else {
      newSelection.delete(recordId);
    }
    setSelectedRecords(newSelection);
  };

  const handleDelete = () => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record to delete.');
      return;
    }

    const recordCount = selectedRecords.size;
    const confirmMessage = `Are you sure you want to delete ${recordCount} selected record${recordCount === 1 ? '' : 's'}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      onDeleteRecords(Array.from(selectedRecords));
      setSelectedRecords(new Set());
      setIsEditMode(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set()); // Deselect all
    } else {
      setSelectedRecords(new Set(records.map(record => record.id))); // Select all
    }
  };

  return (
    <Card 
      title="Commute History" 
      headerAction={
        <div className="flex items-center space-x-2">
          {isEditMode && selectedRecords.size > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {selectedRecords.size === records.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <button
            onClick={handleEditModeToggle}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
            title={isEditMode ? 'Exit edit mode' : 'Edit records'}
          >
            {isEditMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
          </button>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto">
        <ul className="divide-y divide-gray-700">
          {records.map(record => (
            <HistoryItem 
              key={record.id} 
              record={record} 
              median={median}
              isEditMode={isEditMode}
              isSelected={selectedRecords.has(record.id)}
              onSelect={handleRecordSelect}
            />
          ))}
        </ul>
      </div>
      
      {isEditMode && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-center">
          <button
            onClick={handleDelete}
            disabled={selectedRecords.size === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedRecords.size === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Selected ({selectedRecords.size})</span>
          </button>
        </div>
      )}
    </Card>
  );
};