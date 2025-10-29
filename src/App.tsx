

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { MainView } from './components/MainView';
import { StatsView } from './components/StatsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { useLocalStorage } from './hooks/useLocalStorage';
import * as statsService from './services/statsService';
import type { CommuteRecord, Coordinates, View } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [commuteRecords, setCommuteRecords] = useLocalStorage<CommuteRecord[]>('commuteRecords', []);
  const [workLocations, setWorkLocations] = useLocalStorage<Coordinates[]>('workLocations', []);
  const [autoStopRadius, setAutoStopRadius] = useLocalStorage<number>('autoStopRadius', 50);
  const [autoStopEnabled, setAutoStopEnabled] = useLocalStorage<boolean>('autoStopEnabled', true);
  const [autoRecordWorkLocation, setAutoRecordWorkLocation] = useLocalStorage<boolean>('autoRecordWorkLocation', false);
  const version = '0.5.1';

  const averageWorkLocation = useMemo<Coordinates | null>(() => {
    if (workLocations.length === 0) return null;
    const total = workLocations.reduce(
      (acc, loc) => {
        acc.latitude += loc.latitude;
        acc.longitude += loc.longitude;
        return acc;
      },
      { latitude: 0, longitude: 0 }
    );
    return {
      latitude: total.latitude / workLocations.length,
      longitude: total.longitude / workLocations.length,
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
    setWorkLocations(prev => [...prev, location]);
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
        return <StatsView records={commuteRecords} stats={stats} />;
      case 'history':
        return <HistoryView records={commuteRecords} median={stats?.median} onDeleteRecords={deleteCommuteRecords} />;
      case 'settings':
        return <SettingsView 
          onAddLocation={addWorkLocation} 
          workLocationCount={workLocations.length} 
          onClearAllData={clearAllData}
          autoStopRadius={autoStopRadius}
          onAutoStopRadiusChange={setAutoStopRadius}
          autoStopEnabled={autoStopEnabled}
          onAutoStopEnabledChange={setAutoStopEnabled}
          autoRecordWorkLocation={autoRecordWorkLocation}
          onAutoRecordWorkLocationChange={setAutoRecordWorkLocation}
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