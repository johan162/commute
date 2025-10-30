import { describe, it, expect } from 'vitest';
import { getDistance } from '../services/locationService';

describe('locationService', () => {
  describe('getDistance (Haversine formula)', () => {
    it('should calculate distance between San Francisco and Los Angeles', () => {
      // San Francisco: 37.7749° N, 122.4194° W
      const sanFrancisco = { latitude: 37.7749, longitude: -122.4194 };
      
      // Los Angeles: 34.0522° N, 118.2437° W
      const losAngeles = { latitude: 34.0522, longitude: -118.2437 };
      
      const distance = getDistance(sanFrancisco, losAngeles);
      
      // Expected distance: approximately 559 km = 559,000 meters
      // Allow 1% margin of error (±5,590 meters)
      expect(distance).toBeGreaterThan(553000);
      expect(distance).toBeLessThan(565000);
    });

    it('should calculate distance between New York and Boston', () => {
      // New York City: 40.7128° N, 74.0060° W
      const newYork = { latitude: 40.7128, longitude: -74.0060 };
      
      // Boston: 42.3601° N, 71.0589° W
      const boston = { latitude: 42.3601, longitude: -71.0589 };
      
      const distance = getDistance(newYork, boston);
      
      // Expected distance: approximately 306 km = 306,000 meters
      // Allow 1% margin of error
      expect(distance).toBeGreaterThan(303000);
      expect(distance).toBeLessThan(309000);
    });

    it('should calculate zero distance for identical coordinates', () => {
      const coord = { latitude: 37.7749, longitude: -122.4194 };
      const distance = getDistance(coord, coord);
      
      expect(distance).toBe(0);
    });

    it('should handle coordinates very close together', () => {
      // Two points 100 meters apart (approximately)
      const coord1 = { latitude: 37.7749, longitude: -122.4194 };
      const coord2 = { latitude: 37.7758, longitude: -122.4194 }; // ~100m north
      
      const distance = getDistance(coord1, coord2);
      
      // Should be approximately 100 meters (allow ±10m for spherical approximation)
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });

    it('should calculate distance across the equator', () => {
      // Point in Northern hemisphere
      const north = { latitude: 10, longitude: 0 };
      
      // Point in Southern hemisphere
      const south = { latitude: -10, longitude: 0 };
      
      const distance = getDistance(north, south);
      
      // 20 degrees of latitude ≈ 2,223 km
      expect(distance).toBeGreaterThan(2200000);
      expect(distance).toBeLessThan(2240000);
    });

    it('should calculate distance across the prime meridian', () => {
      // Point west of prime meridian
      const west = { latitude: 51.5074, longitude: -10 };
      
      // Point east of prime meridian
      const east = { latitude: 51.5074, longitude: 10 };
      
      const distance = getDistance(west, east);
      
      // At ~51.5° latitude, 20° longitude ≈ 1,380 km (accounting for latitude compression)
      expect(distance).toBeGreaterThan(1350000);
      expect(distance).toBeLessThan(1410000);
    });

    it('should handle international date line crossing', () => {
      // Point just west of date line
      const west = { latitude: 0, longitude: 179 };
      
      // Point just east of date line
      const east = { latitude: 0, longitude: -179 };
      
      const distance = getDistance(west, east);
      
      // Should be ~2° at equator ≈ 222 km
      expect(distance).toBeGreaterThan(220000);
      expect(distance).toBeLessThan(224000);
    });

    it('should calculate distance near poles', () => {
      // Two points near North Pole
      const pole1 = { latitude: 89, longitude: 0 };
      const pole2 = { latitude: 89, longitude: 180 };
      
      const distance = getDistance(pole1, pole2);
      
      // At 89° latitude with 180° longitude difference
      // The great circle distance is still significant (~222 km)
      expect(distance).toBeGreaterThan(210000);
      expect(distance).toBeLessThan(230000);
    });

    it('should be symmetric (distance A→B = distance B→A)', () => {
      const coordA = { latitude: 37.7749, longitude: -122.4194 };
      const coordB = { latitude: 34.0522, longitude: -118.2437 };
      
      const distanceAB = getDistance(coordA, coordB);
      const distanceBA = getDistance(coordB, coordA);
      
      expect(distanceAB).toBe(distanceBA);
    });
  });
});
