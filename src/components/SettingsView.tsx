
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
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onAddLocation, workLocationCount, onClearAllData, autoStopRadius, onAutoStopRadiusChange }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      <Card title="Work Location">
        <div className="space-y-4">
          <p className="text-gray-400">
            To enable automatic arrival detection, please record your work location. You can record it multiple times for better accuracy. The application will use the average of all recorded points.
          </p>
          <p className="text-gray-300 font-semibold">
            Current Recordings: <span className="text-cyan-400">{workLocationCount}</span>
          </p>
          <Button onClick={handleRecordLocation} disabled={loading}>
            {loading ? 'Recording...' : 'Record Current Location'}
          </Button>
          {message && <p className="text-sm text-gray-400 mt-2">{message}</p>}
        </div>
      </Card>

      <Card title="Auto-Stop Settings">
        <div className="space-y-4">
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
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
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
    </div>
  );
};
