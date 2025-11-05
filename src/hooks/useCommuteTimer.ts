
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Coordinates } from '../types';
import { getDistance } from '../services/locationService';

interface UseCommuteTimerProps {
  workLocation: Coordinates | null;
  onStop: (duration: number) => boolean;
  autoStopRadius?: number; // in meters
  autoRecordWorkLocation?: boolean;
  onAddWorkLocation?: (location: Coordinates) => void;
}

export const useCommuteTimer = ({ workLocation, onStop, autoStopRadius = 50, autoRecordWorkLocation = false, onAddWorkLocation }: UseCommuteTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Press "Leaving" to start your commute.');
  const [distance, setDistance] = useState<number | null>(null);
  
  const timerIntervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Load active timer from localStorage on mount
  useEffect(() => {
    const storedStartTime = localStorage.getItem('commuteStartTime');
    if (storedStartTime) {
      const startTime = parseInt(storedStartTime, 10);
      setIsRunning(true);
      setElapsedTime((Date.now() - startTime) / 1000);
      setStatusMessage('Commute resumed...');
    }
  }, []);

  // Start/stop the interval based on isRunning state
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        const storedStartTime = localStorage.getItem('commuteStartTime');
        if (storedStartTime) {
          setElapsedTime((Date.now() - parseInt(storedStartTime, 10)) / 1000);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning]);

  const stopTimer = useCallback((message?: string) => {
    if (!isRunning) return;
    
    setIsRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    const storedStartTime = localStorage.getItem('commuteStartTime');
    const startTime = storedStartTime ? parseInt(storedStartTime, 10) : Date.now();
    const finalDuration = (Date.now() - startTime) / 1000;
    
    // Clear the stored start time
    localStorage.removeItem('commuteStartTime');
    
    // Call onStop and check if the record was saved
    const recordSaved = onStop(finalDuration);
    
    // If record was not saved due to de-bouncing, show appropriate message
    if (!recordSaved) {
      setStatusMessage('Commute NOT recorded. De-bouncing enabled.');
      setTimeout(() => setStatusMessage('Press "Leaving" to start your commute.'), 5000);
      setElapsedTime(0);
      setDistance(null);
      return;
    }
    
    // Auto-record work location if enabled
    if (autoRecordWorkLocation && onAddWorkLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onAddWorkLocation({ latitude, longitude });
          setStatusMessage(message || `Commute recorded! Duration: ${Math.round(finalDuration)}s. Work location auto-recorded.`);
          setTimeout(() => setStatusMessage('Press "Leaving" to start your commute.'), 5000);
          return; // Exit early to avoid setting status message again below
        },
        (error) => {
          console.error('Failed to record work location automatically:', error);
          setStatusMessage(message || `Commute recorded! Duration: ${Math.round(finalDuration)}s. Failed to auto-record location.`);
          setTimeout(() => setStatusMessage('Press "Leaving" to start your commute.'), 5000);
          return; // Exit early to avoid setting status message again below
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setStatusMessage(message || `Commute recorded! Duration: ${Math.round(finalDuration)}s`);
      setTimeout(() => setStatusMessage('Press "Leaving" to start your commute.'), 5000);
    }
    
    setElapsedTime(0);
    setDistance(null);
  }, [isRunning, onStop, autoRecordWorkLocation, onAddWorkLocation]);


  useEffect(() => {
    if (isRunning && workLocation) {
      setStatusMessage('GPS tracking active...');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const currentPosition: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const dist = getDistance(currentPosition, workLocation);
          setDistance(dist);
          setStatusMessage(`Tracking... ${dist.toFixed(0)}m to destination.`);
          if (dist < autoStopRadius) {
            stopTimer('Arrived at work location automatically.');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setStatusMessage('GPS error. Tracking may be unreliable.');
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isRunning, workLocation, autoStopRadius, stopTimer]);

  const startTimer = () => {
    if (isRunning) return;
    
    const startTime = Date.now();
    localStorage.setItem('commuteStartTime', startTime.toString());
    setIsRunning(true);
    setElapsedTime(0);
    setStatusMessage('Commute started. Have a safe trip!');
  };
  
  return { isRunning, elapsedTime, startTimer, stopTimer, statusMessage, distance };
};
