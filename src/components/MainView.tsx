import React from 'react';
import type { Coordinates } from '../types';
import { useCommuteTimer } from '../hooks/useCommuteTimer';
import { Card } from './Card';

interface MainViewProps {
  onSaveCommute: (duration: number) => void;
  workLocation: Coordinates | null;
  autoStopRadius: number;
  autoRecordWorkLocation: boolean;
  onAddWorkLocation: (location: Coordinates) => void;
  useNixieDisplay?: boolean;
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Nixie tube digit component
const NixieDigit: React.FC<{ digit: string; isColon?: boolean }> = ({ digit, isColon = false }) => {
  if (isColon) {
    return (
      <div className="flex flex-col items-center justify-center h-28 w-4 mx-1">
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50 animate-pulse"></div>
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50 animate-pulse mt-2"></div>
      </div>
    );
  }

  return (
    <div className="relative h-28 w-16 mx-1 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-inner overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-orange-600/20"></div>

      {/* Digit */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <span className="text-6xl sm:text-7xl md:text-8xl font-bold text-orange-400 font-mono tracking-wider drop-shadow-lg">
          {digit}
        </span>
      </div>

      {/* Inner glow */}
      <div className="absolute inset-2 bg-orange-400/10 rounded-md"></div>

      {/* Reflection effect */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/20 to-transparent"></div>
    </div>
  );
};

// Nixie tube display component
const NixieDisplay: React.FC<{ time: string }> = ({ time }) => {
  const digits = time.split('');

  return (
    <div className="flex items-center justify-center">
      {digits.map((char, index) => (
        <NixieDigit
          key={index}
          digit={char}
          isColon={char === ':'}
        />
      ))}
    </div>
  );
};

export const MainView: React.FC<MainViewProps> = ({ onSaveCommute, workLocation, autoStopRadius, autoRecordWorkLocation, onAddWorkLocation, useNixieDisplay = false }) => {
  const { isRunning, elapsedTime, startTimer, stopTimer, statusMessage, distance } = useCommuteTimer({
    workLocation,
    onStop: onSaveCommute,
    autoStopRadius,
    autoRecordWorkLocation,
    onAddWorkLocation,
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
            <p className="text-lg text-gray-400 mb-4">Commute Duration</p>
            {useNixieDisplay ? (
              <NixieDisplay time={formatTime(elapsedTime)} />
            ) : (
              <h2 className="text-5xl sm:text-7xl md:text-8xl font-mono font-bold tracking-widest text-cyan-400">
                {formatTime(elapsedTime)}
              </h2>
            )}
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
