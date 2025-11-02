
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Coordinates } from '../src/types';
import { getDistance } from '../src/services/locationService';

interface UseCommuteTimerProps {
  workLocation: Coordinates | null;
  onStop: (duration: number) => void;
  autoStopRadius?: number; // in meters
}

export const useCommuteTimer = ({ workLocation, onStop, autoStopRadius = 100 }: UseCommuteTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Press "Leaving" to start your commute.');
  const [distance, setDistance] = useState<number | null>(null);
  
  const timerIntervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

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
    
    const finalDuration = (Date.now() - (startTimeRef.current || Date.now())) / 1000;
    onStop(finalDuration);
    
    setElapsedTime(0);
    setDistance(null);
    setStatusMessage(message || `Commute recorded! Duration: ${Math.round(finalDuration)}s`);
    setTimeout(() => setStatusMessage('Press "Leaving" to start your commute.'), 5000);
  }, [isRunning, onStop]);


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
    
    setIsRunning(true);
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    setStatusMessage('Commute started. Have a safe trip!');
    
    timerIntervalRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      }
    }, 1000);
  };
  
  return { isRunning, elapsedTime, startTimer, stopTimer, statusMessage, distance };
};
