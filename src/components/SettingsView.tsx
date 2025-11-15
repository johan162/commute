import React, { useEffect, useState } from 'react';
import type { Coordinates, WorkLocation, CommuteRecord, DebounceMode } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SettingsViewProps {
  onAddLocation: (location: Coordinates) => void;
  onClearWorkLocations: () => void;
  workLocationCount: number;
  averageWorkLocation: Coordinates | null;
  workLocations: WorkLocation[];
  onClearAllData: () => void;
  autoStopRadius: number;
  onAutoStopRadiusChange: (radius: number) => void;
  autoStopEnabled: boolean;
  onAutoStopEnabledChange: (enabled: boolean) => void;
  autoRecordWorkLocation: boolean;
  onAutoRecordWorkLocationChange: (enabled: boolean) => void;
  includeWeekends: boolean;
  onIncludeWeekendsChange: (enabled: boolean) => void;
  onLoadDebugData: (records: any[]) => void;
  useNixieDisplay: boolean;
  onUseNixieDisplayChange: (enabled: boolean) => void;
  showAdvancedStatistics: boolean;
  onShowAdvancedStatisticsChange: (enabled: boolean) => void;
  showCalendarHeatmap: boolean;
  onShowCalendarHeatmapChange: (enabled: boolean) => void;
  onImportCSV: (records: CommuteRecord[]) => void;
  debouncingEnabled: boolean;
  onDebouncingEnabledChange: (enabled: boolean) => void;
  debouncingLimit: number;
  onDebouncingLimitChange: (limit: number) => void;
  debouncingMode: DebounceMode;
  onDebouncingModeChange: (mode: DebounceMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onAddLocation, onClearWorkLocations, workLocationCount, averageWorkLocation, workLocations, onClearAllData, autoStopRadius, onAutoStopRadiusChange, autoStopEnabled, onAutoStopEnabledChange, autoRecordWorkLocation, onAutoRecordWorkLocationChange, includeWeekends, onIncludeWeekendsChange, onLoadDebugData, useNixieDisplay, onUseNixieDisplayChange, showAdvancedStatistics, onShowAdvancedStatisticsChange, showCalendarHeatmap, onShowCalendarHeatmapChange, onImportCSV, debouncingEnabled, onDebouncingEnabledChange, debouncingLimit, onDebouncingLimitChange, debouncingMode, onDebouncingModeChange }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAboutDetails, setShowAboutDetails] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMessage, setImportMessage] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  
  // Debug mode state - persist debug visibility across tab switches
  const [debugVisible, setDebugVisible] = useLocalStorage('debugCardVisible', false);
  const [toggleCount, setToggleCount] = useState(0);
  const [firstToggleTime, setFirstToggleTime] = useState<number | null>(null);
  const [debugRecordCount, setDebugRecordCount] = useState(500);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');
  
  // Distribution parameters
  const [normalMean, setNormalMean] = useState(25);
  const [normalStdDev, setNormalStdDev] = useState(5);
  const [noisyMean, setNoisyMean] = useState(25);
  const [noisyStdDev, setNoisyStdDev] = useState(5);
  const [noiseAmplitude, setNoiseAmplitude] = useState(3);
  const [randomMin, setRandomMin] = useState(15);
  const [randomMax, setRandomMax] = useState(45);
  const [tMean, setTMean] = useState(25);
  const [tStdDev, setTStdDev] = useState(6);
  const [tDf, setTDf] = useState(5);
  const [logNormalMin, setLogNormalMin] = useState(15);
  const [logNormalMax, setLogNormalMax] = useState(60);
  const [betaAlpha, setBetaAlpha] = useState(2);
  const [betaBeta, setBetaBeta] = useState(5);
  const [betaMin, setBetaMin] = useState(10);
  const [betaMax, setBetaMax] = useState(50);
  const [bimodalMorningMean, setBimodalMorningMean] = useState(22);
  const [bimodalMorningStdDev, setBimodalMorningStdDev] = useState(4);
  const [bimodalEveningMean, setBimodalEveningMean] = useState(28);
  const [bimodalEveningStdDev, setBimodalEveningStdDev] = useState(6);
  const [trendMean, setTrendMean] = useState(25);
  const [trendStdDev, setTrendStdDev] = useState(5);
  const [trendPercentage, setTrendPercentage] = useState(20);

  const canUseAutoStop = workLocationCount > 0;

  const debounceModes: { value: DebounceMode; title: string; description: string }[] = [
    {
      value: 'disable-button',
      title: 'Lock Arrive Button',
      description: 'Arrive is disabled until the minimum duration has elapsed. Prevents accidental early stops.'
    },
    {
      value: 'discard-record',
      title: 'Allow but Discard',
      description: 'Arrive stays active, but commutes shorter than the limit are ignored when saving.'
    }
  ];

  useEffect(() => {
    if (!canUseAutoStop && autoStopEnabled) {
      onAutoStopEnabledChange(false);
    }
  }, [canUseAutoStop, autoStopEnabled, onAutoStopEnabledChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImportFile(event.target.files[0]);
      setImportMessage('');
    }
  };

  const handleImport = () => {
    if (!importFile) {
      setImportMessage('Please select a file to import.');
      return;
    }

    if (!window.confirm('Are you sure you want to import this CSV file? All existing commute records will be replaced.')) {
      return;
    }

    setImportLoading(true);
    setImportMessage('Importing...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split(/\r\n|\n/);
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Verify headers
        const expectedHeaders = ['ID', 'Date', 'Time', 'Duration (s)'];
        if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
            throw new Error(`Invalid CSV headers. Expected: ${expectedHeaders.join(',')}`);
        }

        const records: CommuteRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i]) continue;
          const values = lines[i].split(',');
          const [idStr, dateStr, timeStr, durationStr] = values;

          // This is fragile due to toLocaleDateString in export.
          // It assumes the date format can be parsed by new Date().
          const date = new Date(`${dateStr} ${timeStr}`);
          if (isNaN(date.getTime())) {
            console.warn(`Skipping invalid date: ${dateStr} ${timeStr}`);
            continue;
          }

          records.push({
            id: parseInt(idStr, 10) || date.getTime(),
            date: date.toISOString(),
            duration: parseFloat(durationStr),
          });
        }
        
        onImportCSV(records);
        setImportLoading(false);
        setImportMessage(`✅ Successfully imported ${records.length} records.`);
        setImportFile(null);
      } catch (error: any) {
        setImportLoading(false);
        setImportMessage(`❌ Error importing file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      setImportLoading(false);
      setImportMessage('❌ Error reading file.');
    };
    reader.readAsText(importFile);
  };

  // Format coordinates in human-readable format
  const formatCoordinates = (coords: Coordinates): string => {
    const latDirection = coords.latitude >= 0 ? 'N' : 'S';
    const lonDirection = coords.longitude >= 0 ? 'E' : 'W';
    const lat = Math.abs(coords.latitude).toFixed(6);
    const lon = Math.abs(coords.longitude).toFixed(6);
    const accuracyText = coords.accuracy ? ` (±${Math.round(coords.accuracy)}m)` : '';
    return `${lat}° ${latDirection}, ${lon}° ${lonDirection}${accuracyText}`;
  };

  // Get accuracy quality indicator
  const getAccuracyQuality = (accuracy: number) => {
    if (accuracy <= 5) return { color: 'bg-green-500', label: 'Excellent' };
    if (accuracy <= 10) return { color: 'bg-green-400', label: 'Very Good' };
    if (accuracy <= 25) return { color: 'bg-yellow-500', label: 'Good' };
    if (accuracy <= 50) return { color: 'bg-orange-500', label: 'Fair' };
    return { color: 'bg-red-500', label: 'Poor' };
  };

  // Open map application with coordinates
  const openInMap = (coords: Coordinates) => {
    // Use geo: URI scheme which works cross-platform
    // iOS: Opens in Apple Maps
    // Android: Opens in Google Maps or default map app
    // Desktop: Opens in default browser map service
    const url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    window.open(url, '_blank');
  };

  // Statistical distribution generators
  const boxMullerTransform = () => {
    const u = Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const generateNormal = (mean: number, stdDev: number, count: number): number[] => {
    return Array.from({ length: count }, () => mean + stdDev * boxMullerTransform());
  };

  const generateNoisyNormal = (mean: number, stdDev: number, noiseMean: number, noiseAmplitude: number, count: number): number[] => {
    return Array.from({ length: count }, () => {
      const normal = mean + stdDev * boxMullerTransform();
      const noise = noiseMean + noiseAmplitude * (Math.random() - 0.5);
      return normal + noise;
    });
  };

  const generateRandom = (min: number, max: number, count: number): number[] => {
    return Array.from({ length: count }, () => min + Math.random() * (max - min));
  };

  const generateTDistribution = (mean: number, stdDev: number, df: number, count: number): number[] => {
    // Simplified t-distribution approximation using normal + scaling
    return Array.from({ length: count }, () => {
      const normal = boxMullerTransform();
      const chi2Approx = Math.sqrt(df / (df + normal * normal));
      return mean + stdDev * normal / chi2Approx;
    });
  };

  const generateLogNormal = (minVal: number, maxVal: number, count: number): number[] => {
    // Interpret min/max as roughly the 5th/95th percentiles to solve for μ and σ
    const zLow = -1.6448536269514729;  // Φ⁻¹(0.05)
    const zHigh = 1.6448536269514729; // Φ⁻¹(0.95)

    const effectiveMin = Math.max(minVal, 1e-6);
    const effectiveMax = Math.max(maxVal, effectiveMin + 1e-6);

    const logMin = Math.log(effectiveMin);
    const logMax = Math.log(effectiveMax);

    const sigma = (logMax - logMin) / (zHigh - zLow);
    if (!isFinite(sigma) || sigma <= 0) {
      return Array.from({ length: count }, () => minVal);
    }

    const mu = logMin - sigma * zLow;

    return Array.from({ length: count }, () => {
      const normal = boxMullerTransform();
      const sample = Math.exp(mu + sigma * normal);
      return Math.min(Math.max(sample, minVal), maxVal);
    });
  };

  const generateBeta = (alpha: number, beta: number, min: number, max: number, count: number): number[] => {
    // Simple beta distribution approximation
    return Array.from({ length: count }, () => {
      let x = 0, y = 0;
      for (let i = 0; i < alpha; i++) x += -Math.log(Math.random());
      for (let i = 0; i < beta; i++) y += -Math.log(Math.random());
      const betaVal = x / (x + y);
      return min + betaVal * (max - min);
    });
  };

  const generateBimodalNormal = (morningMean: number, morningStdDev: number, eveningMean: number, eveningStdDev: number, count: number): number[] => {
    const durations: number[] = [];
    const numPairs = Math.ceil(count / 2);
    for (let i = 0; i < numPairs; i++) {
      // Morning commute
      durations.push(morningMean + morningStdDev * boxMullerTransform());
      // Evening commute
      durations.push(eveningMean + eveningStdDev * boxMullerTransform());
    }
    return durations.slice(0, count); // Ensure exact count
  };

  const generateTrendingNormal = (mean: number, stdDev: number, trendPercentage: number, count: number): number[] => {
    const durations: number[] = [];
    const totalChange = mean * (trendPercentage / 100);
    const changePerRecord = count > 1 ? totalChange / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const adjustedMean = mean + (i * changePerRecord);
      const duration = adjustedMean + stdDev * boxMullerTransform();
      durations.push(duration);
    }
    return durations;
  };

  const createDebugRecords = (durations: number[]) => {
    const now = new Date();
    const records = [];
    
    // Calculate how many weekdays we need (2 commutes per weekday)
    const weekdaysNeeded = Math.ceil(durations.length / 2);
    
    // Account for weekends: roughly N/5 weeks means N/5 * 2 weekend days
    // Total calendar days = weekdays + weekends = N/2 + (N/2 / 5) * 2 ≈ N/2 * 1.4
    const calendarDaysToGoBack = Math.ceil(weekdaysNeeded * 1.5); // Use 1.5 to be safe
    
    let currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() - calendarDaysToGoBack);
    
    // Move to the most recent Monday before our start date
    while (currentDate.getDay() !== 1) { // 1 = Monday
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    let durationIndex = 0;
    
    while (durationIndex < durations.length) {
      const dayOfWeek = currentDate.getDay();
      
      // Cap at current date to avoid generating future data
      if (currentDate > now) {
        break;
      }
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Morning commute: random time between 07:00 - 08:00
        if (durationIndex < durations.length) {
          const morningDate = new Date(currentDate);
          const morningHour = 7;
          const morningMinute = Math.floor(Math.random() * 60); // 0-59 minutes
          morningDate.setHours(morningHour, morningMinute, 0, 0);
          
          // Only add if not in the future
          if (morningDate <= now) {
            records.push({
              id: Date.now() + durationIndex,
              date: morningDate.toISOString(),
              duration: Math.max(60, Math.round(durations[durationIndex]))
            });
            durationIndex++;
          }
        }
        
        // Evening commute: random time between 16:30 - 18:30
        if (durationIndex < durations.length) {
          const eveningDate = new Date(currentDate);
          const eveningMinutes = 16 * 60 + 30 + Math.floor(Math.random() * 120); // 16:30 to 18:30
          const eveningHour = Math.floor(eveningMinutes / 60);
          const eveningMinute = eveningMinutes % 60;
          eveningDate.setHours(eveningHour, eveningMinute, 0, 0);
          
          // Only add if not in the future
          if (eveningDate <= now) {
            records.push({
              id: Date.now() + durationIndex + 1000000,
              date: eveningDate.toISOString(),
              duration: Math.max(60, Math.round(durations[durationIndex]))
            });
            durationIndex++;
          }
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return records;
  };

  const loadDebugData = (durations: number[], distributionName: string) => {
    setDebugLoading(true);
    setDebugMessage('Generating data...');
    
    // Simulate async loading for better UX
    setTimeout(() => {
      const records = createDebugRecords(durations);
      onLoadDebugData(records);
      setDebugLoading(false);
      setDebugMessage(`✅ Loaded ${records.length} ${distributionName} records successfully!`);
      
      // Clear message after 3 seconds
      setTimeout(() => setDebugMessage(''), 3000);
    }, 100);
  };

  const handleRecordLocation = () => {
    setLoading(true);
    setMessage('Getting your current location with high precision...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Create location object with accuracy information
        const locationWithAccuracy = { 
          latitude, 
          longitude, 
          accuracy: accuracy || 50 // Default to 50m if accuracy not available
        };
        
        onAddLocation(locationWithAccuracy);
        setLoading(false);
        
        const accuracyText = accuracy ? `±${Math.round(accuracy)}m accuracy` : '±50m accuracy (estimated)';
        const weightText = workLocationCount > 0 ? 
          `` : 
          ` This is your first work location recording.`;
        
        setMessage(
          `✅ Location recorded with ${accuracyText}! ` +
          `Total recordings: ${workLocationCount + 1}.${weightText}`
        );
      },
      (error) => {
        setLoading(false);
        setMessage(`❌ Error: ${error.message}`);
      },
      { 
        enableHighAccuracy: true,    // Request highest accuracy available
        timeout: 20000,              // Increased timeout for better accuracy
        maximumAge: 0                // Force fresh GPS reading
      }
    );
  };

  const handleClearWorkLocations = () => {
    onClearWorkLocations();
    setMessage(''); // Clear the message when work locations are cleared
  };

  const handleWeekendToggle = (enabled: boolean) => {
    const now = Date.now();
    
    if (firstToggleTime === null) {
      setFirstToggleTime(now);
      setToggleCount(1);
    } else {
      // Reset if more than 60 seconds have passed
      if (now - firstToggleTime > 60000) {
        setFirstToggleTime(now);
        setToggleCount(1);
      } else {
        const newCount = toggleCount + 1;
        setToggleCount(newCount);
        
        // Enable debug mode if 10 toggles within 60 seconds
        if (newCount >= 10) {
          setDebugVisible(true);
          setToggleCount(0);
          setFirstToggleTime(null);
        }
      }
    }
    
    onIncludeWeekendsChange(enabled);
  };

  return (
    <div className="space-y-6">

      <Card title="Work Location">
        <div className="space-y-4">
          <p className="text-gray-400">
            Record your work location to enable automatic arrival detection. 
          </p>
          <p className="text-xs text-gray-500">
            The application will use a Bayesian weighted average to take each new recorded location into account based on its accuracy.
          </p>
          <p className="text-gray-300 font-semibold">
            Current Recordings: <span className="text-cyan-400">{workLocationCount}</span>
          </p>
          <div className="flex gap-4">
            <Button onClick={handleRecordLocation} disabled={loading}>
              {loading ? 'Recording...' : 'Record Current Location'}
            </Button>
            <Button 
              onClick={handleClearWorkLocations} 
              disabled={workLocationCount === 0}
              variant="danger"
            >
              Clear Work Locations
            </Button>
          </div>
          
          {averageWorkLocation && (
            <div className="bg-gray-800 p-3 rounded-lg mt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    Bayesian Weighted Average Work Location:
                  </p>
                  <p className="text-sm text-gray-300 font-mono">
                    {formatCoordinates(averageWorkLocation)}
                  </p>
                  {averageWorkLocation.accuracy && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${
                        getAccuracyQuality(averageWorkLocation.accuracy).color
                      }`}></div>
                      <p className="text-xs text-gray-500">
                        Effective accuracy: ±{Math.round(averageWorkLocation.accuracy)}m
                        <span className="ml-2 text-gray-400">
                          ({getAccuracyQuality(averageWorkLocation.accuracy).label})
                        </span>
                        {workLocationCount > 1 && (
                          <span className="ml-2">
                            from {workLocationCount} weighted measurements
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openInMap(averageWorkLocation)}
                  className="ml-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center"
                  title="Open in maps"
                  aria-label="Open location in maps"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 text-cyan-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                    />
                  </svg>
                </button>
              </div>

              {/* Individual location details with accuracy weighting information */}
              {workLocations.length > 1 && (
                <div className="mt-3 text-xs text-gray-500">
                  <details className="cursor-pointer">
                    <summary className="hover:text-gray-400 flex items-center space-x-2">
                      <span>📍 Show individual recordings with accuracy weights ({workLocationCount} total)</span>
                    </summary>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-gray-900 p-3 rounded">
                      {workLocations.map((loc, index) => {
                        const weight = 1 / (loc.accuracy * loc.accuracy);
                        const totalWeight = workLocations.reduce((sum, l) => sum + (1 / (l.accuracy * l.accuracy)), 0);
                        const contribution = (weight / totalWeight) * 100;
                        const quality = getAccuracyQuality(loc.accuracy);
                        
                        return (
                          <div key={index} className="flex justify-between items-center text-xs bg-gray-800 p-2 rounded">
                            <div className="flex flex-col space-y-1">
                              <span className="font-mono text-gray-400">
                                {new Date(loc.timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-gray-500">
                                {contribution.toFixed(1)}% weight in average
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`h-2 w-2 rounded-full ${quality.color}`}></div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                loc.accuracy <= 10 ? 'bg-green-900 text-green-300' :
                                loc.accuracy <= 25 ? 'bg-yellow-900 text-yellow-300' :
                                loc.accuracy <= 50 ? 'bg-orange-900 text-orange-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                ±{Math.round(loc.accuracy)}m
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
          
          {message && <p className="text-sm text-gray-400 mt-2">{message}</p>}
        </div>
      </Card>

      
      <Card title="AutoStop Feature">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 font-semibold">Enable AutoStop</span>
            <div className="relative inline-block w-12 h-6 flex-shrink-0">
              <input
                type="checkbox"
                checked={autoStopEnabled}
                onChange={(e) => {
                  if (!canUseAutoStop && e.target.checked) return;
                  onAutoStopEnabledChange(e.target.checked);
                }}
                disabled={!canUseAutoStop}
                className="sr-only"
                id="autoStopToggle"
              />
              <label
                htmlFor="autoStopToggle"
                className={`block w-12 h-6 rounded-full transition-colors duration-200 ${
                  autoStopEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                } ${canUseAutoStop ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
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
            When enabled the timer will automatically stop when entering the Geo-Fence of your work location.
          </p>
          {!canUseAutoStop && (
            <p className="text-xs text-yellow-400">Add at least one work location to enable AutoStop.</p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-semibold">Auto-record Work Location</span>
              <div className="relative inline-block w-12 h-6 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={autoRecordWorkLocation}
                  onChange={(e) => onAutoRecordWorkLocationChange(e.target.checked)}
                  className="sr-only"
                  id="autoRecordWorkLocationToggle"
                />
                <label
                  htmlFor="autoRecordWorkLocationToggle"
                  className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                    autoRecordWorkLocation ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${
                      autoRecordWorkLocation ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Automatically record your GPS location as a work each time you stop the timer.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="autoStopRadius" className="text-gray-300 font-semibold">
                  AutoStop GeoFence
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
                Smaller radius = more precise arrival detection but may require you to be very close.
                <br />
                Larger radius = more forgiving but may stop the timer before you actually arrive.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Statistics Display">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <span className="text-gray-300 font-semibold">Show Advanced Statistics</span>
              <p className="text-xs text-gray-500 mt-1">Display normality tests and trend analysis</p>
            </div>
            <div className="relative inline-block w-12 h-6 flex-shrink-0">
              <input
                type="checkbox"
                checked={showAdvancedStatistics}
                onChange={(e) => onShowAdvancedStatisticsChange(e.target.checked)}
                className="sr-only"
                id="showAdvancedStatisticsToggle"
              />
              <label
                htmlFor="showAdvancedStatisticsToggle"
                className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  showAdvancedStatistics ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${
                    showAdvancedStatistics ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </label>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <span className="text-gray-300 font-semibold">Include Weekends in Day-of-Week Chart</span>
                <p className="text-xs text-gray-500 mt-1">Show Saturday and Sunday in weekly pattern analysis</p>
              </div>
              <div className="relative inline-block w-12 h-6 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={includeWeekends}
                  onChange={(e) => handleWeekendToggle(e.target.checked)}
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
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <span className="text-gray-300 font-semibold">Show Calendar Heatmap</span>
                <p className="text-xs text-gray-500 mt-1">Display calendar heatmap visualization</p>
              </div>
              <div className="relative inline-block w-12 h-6 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={showCalendarHeatmap}
                  onChange={(e) => onShowCalendarHeatmapChange(e.target.checked)}
                  className="sr-only"
                  id="showCalendarHeatmapToggle"
                />
                <label
                  htmlFor="showCalendarHeatmapToggle"
                  className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                    showCalendarHeatmap ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${
                      showCalendarHeatmap ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <span className="text-gray-300 font-semibold">Nixie Tube Timer Display</span>
                <p className="text-xs text-gray-500 mt-1">Show timer with retro nixie tube style digits</p>
              </div>
              <div className="relative inline-block w-12 h-6 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={useNixieDisplay}
                  onChange={(e) => onUseNixieDisplayChange(e.target.checked)}
                  className="sr-only"
                  id="useNixieDisplayToggle"
                />
                <label
                  htmlFor="useNixieDisplayToggle"
                  className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                    useNixieDisplay ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${
                      useNixieDisplay ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>
            </div>
          </div>

        </div>
      </Card>
      
      <Card title="De-bounce">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <span className="text-gray-300 font-semibold">Enable De-bounce</span>
              <p className="text-xs text-gray-500 mt-1">
                Prevent accidental taps on the Arrive button or discard ultra-short commutes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={debouncingEnabled}
                onChange={(e) => onDebouncingEnabledChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          <div className={`transition-opacity duration-200 ${debouncingEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Minimum Duration</label>
              <span className="text-cyan-400 font-semibold">
                {debouncingLimit === 60 && '1 min'}
                {debouncingLimit === 120 && '2 min'}
                {debouncingLimit === 300 && '5 min'}
                {debouncingLimit === 900 && '15 min'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={
                debouncingLimit === 60 ? 0 :
                debouncingLimit === 120 ? 1 :
                debouncingLimit === 300 ? 2 : 3
              }
              onChange={(e) => {
                const index = parseInt(e.target.value);
                const limits = [60, 120, 300, 900];
                onDebouncingLimitChange(limits[index]);
              }}
              disabled={!debouncingEnabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1m</span>
              <span>2m</span>
              <span>5m</span>
              <span>15m</span>
            </div>
          </div>

          <div className={`space-y-3 ${debouncingEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
            <p className="text-sm text-gray-400">Behavior</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {debounceModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onDebouncingModeChange(mode.value)}
                  className={`text-left border rounded-lg p-3 transition-colors duration-200 ${
                    debouncingMode === mode.value
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-200 font-semibold">{mode.title}</span>
                    {debouncingMode === mode.value && (
                      <span className="text-cyan-400 text-xs font-semibold">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Tip: Switching modes or turning De-bounce off will immediately re-enable the Arrive button if it was locked.
          </p>
        </div>
      </Card>

      <Card title="Data Management">
        <div className="space-y-6">
          {/* Import Data Section */}
          <div className="pb-4 border-b border-gray-700">
          <div className="flex-1 mr-4">
          <span className="text-gray-300 font-semibold">Import Data</span>
          <p className="text-xs text-gray-500 mt-1">
            Import commute records from a CSV file. The file must have the headers: <code>ID,Date,Time,Duration (s)</code>.
          </p>
          </div>
          <p className="text-xs text-yellow-400">
            ⚠️ This will replace all existing commute records.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
            />
            <Button onClick={handleImport} disabled={!importFile || importLoading}>
              {importLoading ? 'Importing...' : 'Import'}
            </Button>
          </div>
          {importMessage && (
            <p className={`text-sm mt-2 ${importMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {importMessage}
            </p>
          )}
        </div>

        <div className="pt-4">
          <div className="space-y-4">
            <div className="flex-1 mr-4">
            <span className="text-gray-300 font-semibold">Clear All Data</span>
              <p className="text-xs text-gray-500 mt-1">
                  Permanently delete all your commute records and saved work locations. 
              </p>
              </div>
              <p className="text-xs text-yellow-400">⚠️ This action cannot be undone!</p>
              <Button onClick={onClearAllData} variant="danger">
                  Clear All Data
              </Button>
          </div>
        </div>
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
                  <div className="flex justify-between">
                    <span className="text-gray-400">Human Central Nervous System (CNS)</span>
                    <span className="text-cyan-400 font-mono">1.0.0</span>
                  </div>
                </div>
              </div>

              {/* Features List 
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Features</h4>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Real-time GPS-based commute tracking</li>
                    <li>• Automatic arrival detection</li>
                    <li>• Statistical analysis both basic and advanced</li>
                    <li>• Interactive charts and histograms</li>
                    <li>• CSV and PDF export capabilities</li>
                    <li>• Offline support via PWA</li>
                    <li>• Local storage (no server required)</li>
                  </ul>
                </div>
              </div>
              */}

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">License</h4>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">
                    <span className="font-semibold text-cyan-400">MIT License</span>
                  </p>
                  <p className="text-xs text-gray-500">

<p>
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
</p>

&nbsp;

<p>
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
</p>

&nbsp;

<p>
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
</p>            
                  </p>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  © 2025 Johan Persson
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All rights reserved <br />
                  (github: <a href="https://github.com/johan162/commute/">https://github.com/johan162/commute/</a>)
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {debugVisible && (
        <Card title="🐛 Debug Tools">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                Generate synthetic commute data with known statistical distributions for testing purposes.
              </p>
              <Button 
                onClick={() => {
                  setDebugVisible(false);
                  setDebugMessage('');
                }}
                variant="danger"
              >
                Hide Debug
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <label htmlFor="recordCount" className="text-sm text-gray-300">
                Number of records:
              </label>
              <input
                id="recordCount"
                type="number"
                min="50"
                max="5000"
                value={debugRecordCount}
                onChange={(e) => setDebugRecordCount(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-md p-2 text-sm w-20"
              />
            </div>

            {debugMessage && (
              <div className={`p-3 rounded-lg ${debugMessage.includes('✅') ? 'bg-green-900 bg-opacity-20 border border-green-700' : 'bg-blue-900 bg-opacity-20 border border-blue-700'}`}>
                <p className={`text-sm ${debugMessage.includes('✅') ? 'text-green-400' : 'text-blue-400'}`}>
                  {debugMessage}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Normal Distribution */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Normal Distribution</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Mean (min)</label>
                    <input
                      type="number"
                      value={normalMean}
                      onChange={(e) => setNormalMean(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Std Dev (min)</label>
                    <input
                      type="number"
                      value={normalStdDev}
                      onChange={(e) => setNormalStdDev(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateNormal(normalMean * 60, normalStdDev * 60, debugRecordCount);
                    loadDebugData(durations, `Normal(μ=${normalMean}m, σ=${normalStdDev}m)`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `Normal (μ=${normalMean}m, σ=${normalStdDev}m)`}
                </Button>
              </div>

              {/* Noisy Normal */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Noisy Normal Distribution</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Mean (min)</label>
                    <input
                      type="number"
                      value={noisyMean}
                      onChange={(e) => setNoisyMean(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Std Dev</label>
                    <input
                      type="number"
                      value={noisyStdDev}
                      onChange={(e) => setNoisyStdDev(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Noise</label>
                    <input
                      type="number"
                      value={noiseAmplitude}
                      onChange={(e) => setNoiseAmplitude(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateNoisyNormal(noisyMean * 60, noisyStdDev * 60, 0, noiseAmplitude * 60, debugRecordCount);
                    loadDebugData(durations, `Noisy Normal(±${noiseAmplitude}m)`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `Noisy Normal (±${noiseAmplitude}m)`}
                </Button>
              </div>

              {/* Random/Uniform */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Uniform Distribution</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Min (min)</label>
                    <input
                      type="number"
                      value={randomMin}
                      onChange={(e) => setRandomMin(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Max (min)</label>
                    <input
                      type="number"
                      value={randomMax}
                      onChange={(e) => setRandomMax(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateRandom(randomMin * 60, randomMax * 60, debugRecordCount);
                    loadDebugData(durations, `Uniform(${randomMin}-${randomMax}m)`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `Uniform (${randomMin}-${randomMax}m)`}
                </Button>
              </div>

              {/* T-Distribution */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">T-Distribution</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Mean</label>
                    <input
                      type="number"
                      value={tMean}
                      onChange={(e) => setTMean(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Std Dev</label>
                    <input
                      type="number"
                      value={tStdDev}
                      onChange={(e) => setTStdDev(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">df</label>
                    <input
                      type="number"
                      min="1"
                      value={tDf}
                      onChange={(e) => setTDf(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateTDistribution(tMean * 60, tStdDev * 60, tDf, debugRecordCount);
                    loadDebugData(durations, `T-Distribution(df=${tDf})`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `T-Distribution (df=${tDf})`}
                </Button>
              </div>

              {/* Log-Normal */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Log-Normal Distribution</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Min (min)</label>
                    <input
                      type="number"
                      value={logNormalMin}
                      onChange={(e) => setLogNormalMin(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Max (min)</label>
                    <input
                      type="number"
                      value={logNormalMax}
                      onChange={(e) => setLogNormalMax(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateLogNormal(logNormalMin * 60, logNormalMax * 60, debugRecordCount);
                    loadDebugData(durations, `Log-Normal(${logNormalMin}-${logNormalMax}m)`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `Log-Normal (${logNormalMin}-${logNormalMax}m)`}
                </Button>
              </div>

              {/* Beta Distribution */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Beta Distribution</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">α (Alpha)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={betaAlpha}
                      onChange={(e) => setBetaAlpha(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">β (Beta)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={betaBeta}
                      onChange={(e) => setBetaBeta(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Min (min)</label>
                    <input
                      type="number"
                      value={betaMin}
                      onChange={(e) => setBetaMin(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Max (min)</label>
                    <input
                      type="number"
                      value={betaMax}
                      onChange={(e) => setBetaMax(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateBeta(betaAlpha, betaBeta, betaMin * 60, betaMax * 60, debugRecordCount);
                    loadDebugData(durations, `Beta(α=${betaAlpha}, β=${betaBeta})`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `Beta (α=${betaAlpha}, β=${betaBeta})`}
                </Button>
              </div>

              {/* Bimodal Normal Distribution */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3 lg:col-span-2">
                <h4 className="text-sm font-semibold text-gray-300">Bimodal Normal Distribution (Morning vs. Evening)</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Morning Mean</label>
                    <input
                      type="number"
                      value={bimodalMorningMean}
                      onChange={(e) => setBimodalMorningMean(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Morning StdDev</label>
                    <input
                      type="number"
                      value={bimodalMorningStdDev}
                      onChange={(e) => setBimodalMorningStdDev(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Evening Mean</label>
                    <input
                      type="number"
                      value={bimodalEveningMean}
                      onChange={(e) => setBimodalEveningMean(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Evening StdDev</label>
                    <input
                      type="number"
                      value={bimodalEveningStdDev}
                      onChange={(e) => setBimodalEveningStdDev(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateBimodalNormal(bimodalMorningMean * 60, bimodalMorningStdDev * 60, bimodalEveningMean * 60, bimodalEveningStdDev * 60, debugRecordCount);
                    loadDebugData(durations, `Bimodal Normal`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `Bimodal (M: μ=${bimodalMorningMean}, E: μ=${bimodalEveningMean})`}
                </Button>
              </div>

              {/* Trending Normal Distribution */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3 lg:col-span-2">
                <h4 className="text-sm font-semibold text-gray-300">Trending Normal Distribution</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Base Mean (min)</label>
                    <input
                      type="number"
                      value={trendMean}
                      onChange={(e) => setTrendMean(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Std Dev (min)</label>
                    <input
                      type="number"
                      value={trendStdDev}
                      onChange={(e) => setTrendStdDev(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Trend (%)</label>
                    <input
                      type="number"
                      value={trendPercentage}
                      onChange={(e) => setTrendPercentage(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const durations = generateTrendingNormal(trendMean * 60, trendStdDev * 60, trendPercentage, debugRecordCount);
                    loadDebugData(durations, `Trending Normal (${trendPercentage > 0 ? '+' : ''}${trendPercentage}%)`);
                  }}
                  disabled={debugLoading}
                >
                  {debugLoading ? 'Loading...' : `Trending Normal (${trendPercentage > 0 ? '+' : ''}${trendPercentage}%)`}
                </Button>
              </div>
            </div>

            <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                ⚠️ Warning: Loading debug data will replace ALL existing commute records!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
