import React, { useMemo } from 'react';
import type { CommuteRecord } from '../types';

interface CalendarHeatmapProps {
  records: CommuteRecord[];
  metric?: 'mean' | 'median';
}

interface DayData {
  date: string;
  value: number;
  count: number;
  dayOfWeek: number;
  weekOfYear: number;
  year: number;
  weekKey: string; // Format: "YYYY-WW"
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ records, metric = 'mean' }) => {
  const heatmapData = useMemo(() => {
    if (records.length === 0) return { grid: [], weeks: [], maxValue: 0, minValue: 0 };

    // Group records by date
    const dateGroups: Record<string, number[]> = {};
    records.forEach(record => {
      const dateKey = record.date.split('T')[0]; // YYYY-MM-DD
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(record.duration);
    });

    // Calculate values for each date
    const dayData: DayData[] = Object.entries(dateGroups).map(([dateStr, durations]) => {
      const date = new Date(dateStr);
      const value = metric === 'median'
        ? getMedian(durations)
        : getMean(durations);
      
      const weekOfYear = getWeekOfYear(date);
      const year = getYearForWeek(date, weekOfYear);
      const weekKey = `${year}-${String(weekOfYear).padStart(2, '0')}`;

      return {
        date: dateStr,
        value: value / 60, // Convert to minutes
        count: durations.length,
        dayOfWeek: date.getDay(), // 0 = Sunday, 1 = Monday, etc.
        weekOfYear,
        year,
        weekKey
      };
    });

    // Find min/max for color scaling
    const values = dayData.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // Group by day of week first, then by week key (year-week)
    const daysMap: Record<number, Record<string, DayData | null>> = {};
    
    // Initialize structure for all 7 days of week
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      daysMap[dayOfWeek] = {};
    }
    
    // Fill in the data
    dayData.forEach(day => {
      daysMap[day.dayOfWeek][day.weekKey] = day;
    });

    // Get all unique week keys from all days, then sort chronologically
    const allWeekKeys = new Set<string>();
    Object.values(daysMap).forEach(dayWeeks => {
      Object.keys(dayWeeks).forEach(weekKey => allWeekKeys.add(weekKey));
    });

    // Get the last 16 weeks
    const windowSize = 16;
    const sortedWeekKeys = Array.from(allWeekKeys).sort((a, b) => a.localeCompare(b)).slice(-windowSize);

    // Create the grid: 7 rows (days) x 16 columns (weeks)
    // Reorder so Monday is first (dayOfWeek 1) and Sunday is last (dayOfWeek 0)
    const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const grid = dayOrder.map(dayOfWeek => {
      return sortedWeekKeys.map(weekKey => daysMap[dayOfWeek][weekKey] || null);
    });

    return { grid, weeks: sortedWeekKeys, maxValue, minValue };
  }, [records, metric]);

  const getColor = (value: number | null, maxValue: number, minValue: number) => {
    if (value === null) return '#374151'; // Gray for missing days

    // Warm color scale from light yellow (fast) to dark brown (slow)
    const intensity = (value - minValue) / (maxValue - minValue);
    
    if (intensity <= 0.5) {
      // Light yellow to orange for faster commutes
      const hue = 45 + (intensity * 2 * 15); // 45° to 60° (yellow to orange)
      const saturation = 70 + (intensity * 2 * 20); // 70% to 90%
      const lightness = 85 - (intensity * 2 * 20); // 85% to 65%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else {
      // Orange to dark brown for slower commutes
      const hue = 25 + ((intensity - 0.5) * 2 * 10); // 25° to 35° (orange to brown)
      const saturation = 90 - ((intensity - 0.5) * 2 * 30); // 90% to 60%
      const lightness = 65 - ((intensity - 0.5) * 2 * 35); // 65% to 30%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  };

  const formatTooltip = (day: DayData | null) => {
    if (!day) return 'No data';

    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${dayName}, ${dateStr}: ${day.value.toFixed(1)} min (${day.count} commute${day.count !== 1 ? 's' : ''})`;
  };

  if (heatmapData.grid.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No commute data to display
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Legend */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">Faster</span>
          <div className="flex space-x-1">
            {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
              <div
                key={intensity}
                className="w-5 h-5 rounded-sm"
                style={{
                  backgroundColor: getColor(
                    heatmapData.minValue + intensity * (heatmapData.maxValue - heatmapData.minValue),
                    heatmapData.maxValue,
                    heatmapData.minValue
                  )
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">Slower</span>
        </div>
      </div>

      {/* Add some space to the heatmap */}
      <div className="h-2" />

      {/* Calendar Grid */}
      <div className="flex flex-col items-center">
        {/* Week labels */}
        <div className="flex mb-1 ml-6">
          {heatmapData.weeks.map((weekKey, index) => {
            const weekNum = parseInt(weekKey.split('-')[1]);
            return (
              <div key={weekKey} className="w-5 text-center">
                {index % 2 === 0 && (
                  <div className="text-xs text-gray-500 transform -rotate-45 origin-center whitespace-nowrap">
                    W{weekNum}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Days and cells */}
        {heatmapData.grid.map((weekData, dayOfWeek) => (
          <div key={dayOfWeek} className="flex items-center mb-0.5">
            {/* Day label */}
            <div className="w-5 text-xs text-gray-500 text-center leading-tight mr-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'][dayOfWeek]}
            </div>

            {/* Week cells */}
            <div className="flex">
              {weekData.map((day, weekIndex) => (
                <div
                  key={weekIndex}
                  className="w-5 h-5 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-cyan-400 hover:ring-opacity-50"
                  style={{
                    backgroundColor: getColor(
                      day?.value || null,
                      heatmapData.maxValue,
                      heatmapData.minValue
                    )
                  }}
                  title={day ? formatTooltip(day) : 'No data'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing maximum 16 weeks • {records.length} total commutes
      </div>
    </div>
  );
};

// Helper functions
function getMean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function getWeekOfYear(date: Date): number {
  // ISO 8601 week number calculation
  // Copy date so don't modify original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

function getYearForWeek(date: Date, weekNum: number): number {
  // For ISO weeks, the year is the year of the Thursday in that week
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}