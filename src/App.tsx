

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { MainView } from './components/MainView';
import { StatsView } from './components/StatsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { useLocalStorage } from './hooks/useLocalStorage';
import * as statsService from './services/statsService';
import type { CommuteRecord, Coordinates, WorkLocation, View } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [commuteRecords, setCommuteRecords] = useLocalStorage<CommuteRecord[]>('commuteRecords', []);
  const [workLocations, setWorkLocations] = useLocalStorage<WorkLocation[]>('workLocations', []);
  const [autoStopRadius, setAutoStopRadius] = useLocalStorage<number>('autoStopRadius', 50);
  const [autoStopEnabled, setAutoStopEnabled] = useLocalStorage<boolean>('autoStopEnabled', true);
  const [autoRecordWorkLocation, setAutoRecordWorkLocation] = useLocalStorage<boolean>('autoRecordWorkLocation', false);
  const [includeWeekends, setIncludeWeekends] = useLocalStorage<boolean>('includeWeekends', false);
  const version = '0.11.0';

  const averageWorkLocation = useMemo<Coordinates | null>(() => {
    if (workLocations.length === 0) return null;
    
    // Bayesian weighted average based on GPS accuracy
    // More accurate readings (lower accuracy values) get higher weights
    const locationsWithWeights = workLocations.map(loc => ({
      ...loc,
      weight: 1 / (loc.accuracy * loc.accuracy)  // Inverse square weighting
    }));
    
    const totalWeight = locationsWithWeights.reduce((sum, loc) => sum + loc.weight, 0);
    
    // Calculate weighted averages
    const weightedLat = locationsWithWeights.reduce(
      (sum, loc) => sum + (loc.latitude * loc.weight), 0
    ) / totalWeight;
    
    const weightedLon = locationsWithWeights.reduce(
      (sum, loc) => sum + (loc.longitude * loc.weight), 0
    ) / totalWeight;
    
    // Calculate effective accuracy of the weighted average
    // The effective accuracy decreases as we add more accurate measurements
    const effectiveAccuracy = Math.sqrt(1 / totalWeight);
    
    return { 
      latitude: weightedLat, 
      longitude: weightedLon,
      accuracy: effectiveAccuracy
    };
  }, [workLocations]);
  
  const stats = useMemo(() => {
    if (commuteRecords.length < 1) return null;
    const durations = commuteRecords.map(r => r.duration);
    return {
      min: statsService.getMin(durations),
      max: statsService.getMax(durations),
      mean: statsService.getMean(durations),
      median: statsService.getMedian(durations),
      stdDev: statsService.getStdDev(durations),
    };
  }, [commuteRecords]);

  const addCommuteRecord = (duration: number) => {
    const newRecord: CommuteRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration,
    };
    setCommuteRecords(prev => [...prev, newRecord].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const addWorkLocation = (location: Coordinates) => {
    const timestamp = new Date().toISOString();
    const accuracy = location.accuracy || 50; // Default to 50m if accuracy not provided
    
    const workLocation: WorkLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy,
      timestamp
    };
    
    setWorkLocations(prev => [...prev, workLocation]);
  };

  const clearWorkLocations = () => {
    if (window.confirm('Are you sure you want to clear all work location recordings? This will disable automatic arrival detection until you record new locations.')) {
      setWorkLocations([]);
      alert('All work location recordings have been cleared.');
    }
  };
  
  const deleteCommuteRecords = (recordIds: number[]) => {
    setCommuteRecords(prev => prev.filter(record => !recordIds.includes(record.id)));
  };

  const clearAllData = () => {
    if(window.confirm('Are you sure you want to delete all commute records and work locations? This action cannot be undone.')){
        setCommuteRecords([]);
        setWorkLocations([]);
        alert('All data has been cleared.');
    }
  };

  const renderView = () => {
    switch (view) {
      case 'stats':
        return <StatsView records={commuteRecords} stats={stats} includeWeekends={includeWeekends} />;
      case 'history':
        return <HistoryView records={commuteRecords} median={stats?.median} onDeleteRecords={deleteCommuteRecords} />;
      case 'settings':
        return <SettingsView 
          onAddLocation={addWorkLocation}
          onClearWorkLocations={clearWorkLocations}
          workLocationCount={workLocations.length}
          averageWorkLocation={averageWorkLocation}
          workLocations={workLocations}
          onClearAllData={clearAllData}
          autoStopRadius={autoStopRadius}
          onAutoStopRadiusChange={setAutoStopRadius}
          autoStopEnabled={autoStopEnabled}
          onAutoStopEnabledChange={setAutoStopEnabled}
          autoRecordWorkLocation={autoRecordWorkLocation}
          onAutoRecordWorkLocationChange={setAutoRecordWorkLocation}
          includeWeekends={includeWeekends}
          onIncludeWeekendsChange={setIncludeWeekends}
          onLoadDebugData={setCommuteRecords}
        />;
      case 'main':
      default:
        return <MainView 
          onSaveCommute={addCommuteRecord} 
          workLocation={autoStopEnabled ? averageWorkLocation : null} 
          autoStopRadius={autoStopRadius} 
          autoRecordWorkLocation={autoRecordWorkLocation}
          onAddWorkLocation={addWorkLocation}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header activeView={view} setView={setView} />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {renderView()}
      </main>
      <footer className="text-center p-4 text-xs text-gray-500">
        <p>Commute Tracker v{version}, &copy; Johan Persson 2025</p>
      </footer>
    </div>
  );
};

export default App;