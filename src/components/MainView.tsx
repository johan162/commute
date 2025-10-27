import React from 'react';
import type { Coordinates } from '../types';
import { useCommuteTimer } from '../hooks/useCommuteTimer';
import { Card } from './Card';

interface MainViewProps {
  onSaveCommute: (duration: number) => void;
  workLocation: Coordinates | null;
  autoStopRadius: number;
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const MainView: React.FC<MainViewProps> = ({ onSaveCommute, workLocation, autoStopRadius }) => {
  const { isRunning, elapsedTime, startTimer, stopTimer, statusMessage, distance } = useCommuteTimer({
    workLocation,
    onStop: onSaveCommute,
    autoStopRadius,
  });

  const handleStart = () => {
    startTimer();
  };

  const handleStop = () => {
    stopTimer();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <Card>
        <div className="text-center">
            <p className="text-lg text-gray-400 mb-2">Commute Duration</p>
            <h2 className="text-5xl sm:text-7xl md:text-8xl font-mono font-bold tracking-widest text-cyan-400">
                {formatTime(elapsedTime)}
            </h2>
        </div>
      </Card>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-2xl rounded-lg shadow-lg transition-transform transform hover:scale-105"
          >
            Leaving
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-6 text-2xl rounded-lg shadow-lg transition-transform transform hover:scale-105"
          >
            Arrive
          </button>
        )}
      </div>

      <div className="text-center text-gray-400 mt-4 h-10">
        <p>{statusMessage}</p>
        {distance !== null && <p>Distance to work: {distance.toFixed(0)}m</p>}
      </div>
    </div>
  );
};
