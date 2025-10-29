
import React, { useState } from 'react';
import type { Coordinates } from '../types';
import { Card } from './Card';
import { Button } from './Button';

interface SettingsViewProps {
  onAddLocation: (location: Coordinates) => void;
  workLocationCount: number;
  onClearAllData: () => void;
  autoStopRadius: number;
  onAutoStopRadiusChange: (radius: number) => void;
  autoStopEnabled: boolean;
  onAutoStopEnabledChange: (enabled: boolean) => void;
  autoRecordWorkLocation: boolean;
  onAutoRecordWorkLocationChange: (enabled: boolean) => void;
  includeWeekends: boolean;
  onIncludeWeekendsChange: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onAddLocation, workLocationCount, onClearAllData, autoStopRadius, onAutoStopRadiusChange, autoStopEnabled, onAutoStopEnabledChange, autoRecordWorkLocation, onAutoRecordWorkLocationChange, includeWeekends, onIncludeWeekendsChange }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAboutDetails, setShowAboutDetails] = useState(false);

  const handleRecordLocation = () => {
    setLoading(true);
    setMessage('Getting your current location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onAddLocation({ latitude, longitude });
        setLoading(false);
        setMessage(`Location recorded! Total recordings: ${workLocationCount + 1}. The average is used as your work location.`);
      },
      (error) => {
        setLoading(false);
        setMessage(`Error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-6">
      <Card title="AutoStop Feature">
        <div className="space-y-4">
          <p className="text-gray-400">
            Enable or disable automatic timer stopping when you arrive at your work location.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-gray-300 font-semibold">Enable AutoStop</span>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={autoStopEnabled}
                onChange={(e) => onAutoStopEnabledChange(e.target.checked)}
                className="sr-only"
                id="autoStopToggle"
              />
              <label
                htmlFor="autoStopToggle"
                className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  autoStopEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${
                    autoStopEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            When disabled, you will need to manually stop the timer when you arrive at work.
          </p>
        </div>
      </Card>

      <Card title="Work Location">
        <div className={`space-y-4 ${!autoStopEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <p className="text-gray-400">
            To enable automatic arrival detection, please record your work location. You can record it multiple times for better accuracy. The application will use the average of all recorded points.
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <span className="text-gray-300 font-semibold">Auto-record Work Location</span>
              <p className="text-xs text-gray-500 mt-1">Record GPS position when stopping timer</p>
            </div>
            <div className="relative inline-block w-12 h-6 flex-shrink-0">
              <input
                type="checkbox"
                checked={autoRecordWorkLocation}
                onChange={(e) => onAutoRecordWorkLocationChange(e.target.checked)}
                className="sr-only"
                id="autoRecordWorkLocationToggle"
                disabled={!autoStopEnabled}
              />
              <label
                htmlFor="autoRecordWorkLocationToggle"
                className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  autoRecordWorkLocation && autoStopEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${
                    autoRecordWorkLocation && autoStopEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, your GPS location will be automatically recorded as a work location each time you stop the commute timer.
          </p>
          
          <p className="text-gray-300 font-semibold">
            Current Recordings: <span className="text-cyan-400">{workLocationCount}</span>
          </p>
          <Button onClick={handleRecordLocation} disabled={loading || !autoStopEnabled}>
            {loading ? 'Recording...' : 'Record Current Location'}
          </Button>
          {message && <p className="text-sm text-gray-400 mt-2">{message}</p>}
        </div>
      </Card>

      <Card title="Auto-Stop Settings">
        <div className={`space-y-4 ${!autoStopEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <p className="text-gray-400">
            Set the radius around your work location where the timer will automatically stop when you arrive.
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="autoStopRadius" className="text-gray-300 font-semibold">
                Auto-Stop Radius
              </label>
              <span className="text-cyan-400 font-bold">{autoStopRadius}m</span>
            </div>
            <input
              id="autoStopRadius"
              type="range"
              min="10"
              max="250"
              step="10"
              value={autoStopRadius}
              onChange={(e) => onAutoStopRadiusChange(Number(e.target.value))}
              disabled={!autoStopEnabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10m</span>
              <span>250m</span>
            </div>
            <p className="text-xs text-gray-500">
              Smaller radius = more precise arrival detection but may require you to be very close to your work location.
              Larger radius = more forgiving but may stop the timer before you actually arrive.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Statistics Display">
        <div className="space-y-4">
          <p className="text-gray-400">
            Configure how data is displayed in the Statistics view.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <span className="text-gray-300 font-semibold">Include Weekends in Day-of-Week Chart</span>
              <p className="text-xs text-gray-500 mt-1">Show Saturday and Sunday in weekly pattern analysis</p>
            </div>
            <div className="relative inline-block w-12 h-6 flex-shrink-0">
              <input
                type="checkbox"
                checked={includeWeekends}
                onChange={(e) => onIncludeWeekendsChange(e.target.checked)}
                className="sr-only"
                id="includeWeekendsToggle"
              />
              <label
                htmlFor="includeWeekendsToggle"
                className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  includeWeekends ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${
                    includeWeekends ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, the day-of-week chart will include weekend data. Most users only commute on weekdays.
          </p>
        </div>
      </Card>
      
      <Card title="Data Management">
        <div className="space-y-4">
            <p className="text-gray-400">
                Permanently delete all your commute records and saved work locations. This action cannot be undone.
            </p>
            <Button onClick={onClearAllData} variant="danger">
                Clear All Data
            </Button>
        </div>
      </Card>

      <Card title="About">
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <span className="text-6xl">ℹ️</span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">Commute Tracker</h3>
            <p className="text-gray-400 mb-4">
              A Progressive Web App for tracking and analyzing your daily commute times
            </p>
          </div>
          
          <button
            onClick={() => setShowAboutDetails(!showAboutDetails)}
            className="w-full flex items-center justify-between bg-gray-800 p-3 rounded-lg hover:bg-gray-750 transition-colors"
          >
            <span className="text-gray-300 font-semibold">
              {showAboutDetails ? '▼ Hide Details' : '▶ Show Details'}
            </span>
          </button>

          {showAboutDetails && (
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Technologies & Libraries</h4>
                <div className="bg-gray-800 p-3 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">React</span>
                    <span className="text-cyan-400 font-mono">19.2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">TypeScript</span>
                    <span className="text-cyan-400 font-mono">5.2.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vite</span>
                    <span className="text-cyan-400 font-mono">7.1.12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">TailwindCSS</span>
                    <span className="text-cyan-400 font-mono">3.4.18</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recharts</span>
                    <span className="text-cyan-400 font-mono">3.3.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">jsPDF</span>
                    <span className="text-cyan-400 font-mono">3.0.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">PWA (vite-plugin-pwa)</span>
                    <span className="text-cyan-400 font-mono">1.1.0</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Features</h4>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Real-time GPS-based commute tracking</li>
                    <li>• Automatic arrival detection</li>
                    <li>• Statistical analysis (Shapiro-Wilk, Mann-Kendall, Runs Test)</li>
                    <li>• Interactive charts and histograms</li>
                    <li>• CSV and PDF export capabilities</li>
                    <li>• Offline support via PWA</li>
                    <li>• Local storage (no server required)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">License</h4>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">
                    <span className="font-semibold text-cyan-400">MIT License</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Open source software that you can use, modify, and distribute freely.
                  </p>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  © 2025 Johan Persson
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All rights reserved
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
