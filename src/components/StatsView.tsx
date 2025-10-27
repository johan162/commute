
import React, { useState, useMemo } from 'react';
import type { CommuteRecord } from '../types';
import { Card } from './Card';
import { HistogramChart } from './HistogramChart';
import { TimeBreakdownView } from './TimeBreakdownView';
import { exportToCSV, exportToPDF } from '../services/exportService';
import { getConfidenceInterval, getConfidenceIntervalRank } from '../services/statsService';
import { Button } from './Button';

interface StatsViewProps {
  records: CommuteRecord[];
  stats: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
  } | null;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};

export const StatsView: React.FC<StatsViewProps> = ({ records, stats }) => {
  const [binSize, setBinSize] = useState(5); // bin size in minutes
  
  // State for time period selections
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Helper function to get Monday of a week
  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Generate available options from records
  const availableOptions = useMemo(() => {
    if (records.length === 0) return { days: [], weeks: [], months: [], years: [] };

    const days = new Set<string>();
    const weeks = new Set<string>();
    const months = new Set<string>();
    const years = new Set<string>();

    records.forEach(record => {
      const date = new Date(record.date);
      
      // Days
      days.add(formatDate(date));
      
      // Weeks (identified by Monday)
      const monday = getMonday(date);
      weeks.add(formatDate(monday));
      
      // Months
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
      
      // Years
      years.add(date.getFullYear().toString());
    });

    return {
      days: Array.from(days).sort().reverse(),
      weeks: Array.from(weeks).sort().reverse(),
      months: Array.from(months).sort().reverse(),
      years: Array.from(years).sort().reverse()
    };
  }, [records]);

  // Calculate total time for different periods
  const calculatePeriodTotal = (period: 'day' | 'week' | 'month' | 'year' | 'total', value?: string): number => {
    if (period === 'total') {
      return records.reduce((sum, r) => sum + r.duration, 0);
    }

    const filteredRecords = records.filter(record => {
      const date = new Date(record.date);
      
      switch (period) {
        case 'day':
          return value ? formatDate(date) === value : false;
        
        case 'week':
          if (!value) return false;
          const monday = getMonday(date);
          return formatDate(monday) === value;
        
        case 'month':
          if (!value) return false;
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return monthKey === value;
        
        case 'year':
          return value ? date.getFullYear().toString() === value : false;
        
        default:
          return false;
      }
    });

    return filteredRecords.reduce((sum, r) => sum + r.duration, 0);
  };

  // Format duration in hours and minutes
  const formatTotalDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // Get month name from YYYY-MM format
  const getMonthName = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Format week label
  const formatWeekLabel = (mondayDate: string): string => {
    const date = new Date(mondayDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate totals for selected periods
  const dayTotal = selectedDay ? calculatePeriodTotal('day', selectedDay) : 0;
  const weekTotal = selectedWeek ? calculatePeriodTotal('week', selectedWeek) : 0;
  const monthTotal = selectedMonth ? calculatePeriodTotal('month', selectedMonth) : 0;
  const yearTotal = selectedYear ? calculatePeriodTotal('year', selectedYear) : 0;
  const totalTime = calculatePeriodTotal('total');

  // Set initial selections
  useMemo(() => {
    if (availableOptions.days.length > 0 && !selectedDay) {
      setSelectedDay(availableOptions.days[0]);
    }
    if (availableOptions.weeks.length > 0 && !selectedWeek) {
      setSelectedWeek(availableOptions.weeks[0]);
    }
    if (availableOptions.months.length > 0 && !selectedMonth) {
      setSelectedMonth(availableOptions.months[0]);
    }
    if (availableOptions.years.length > 0 && !selectedYear) {
      setSelectedYear(availableOptions.years[0]);
    }
  }, [availableOptions, selectedDay, selectedWeek, selectedMonth, selectedYear]);

  if (!stats) {
    return (
      <Card>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Not Enough Data</h2>
          <p className="text-gray-400">Complete at least one commute to see your stats.</p>
        </div>
      </Card>
    );
  }
  
  const handleExportCSV = () => {
      exportToCSV(records);
  }

  const handleExportPDF = () => {
      if (!stats) return;
      exportToPDF(records, stats);
  }

  // Calculate confidence interval using interpolation
  const confidenceInterval = useMemo(() => {
    if (records.length < 5) return null;
    const durations = records.map(record => record.duration);
    return getConfidenceInterval(durations, 90);
  }, [records]);

  // Calculate confidence interval using Nearest Rank method
  const confidenceIntervalRank = useMemo(() => {
    if (records.length < 5) return null;
    const durations = records.map(record => record.duration);
    return getConfidenceIntervalRank(durations, 90);
  }, [records]);

  return (
    <div className="space-y-6">
      <Card title="Statistics Summary">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
          <StatItem label="Total Trips" value={records.length} />
          <StatItem label="Min Time" value={formatDuration(stats.min)} />
          <StatItem label="Max Time" value={formatDuration(stats.max)} />
          <StatItem label="Average" value={formatDuration(stats.mean)} />
          <StatItem label="Median" value={formatDuration(stats.median)} />
        </div>
      </Card>

      <Card title="90% Confidence Interval (Interpolated)">
        <div className="text-center">
          {confidenceInterval ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                90% of commutes fall within this range, interpolated values might not exist exactly
              </p>
              <div className="flex justify-center items-center space-x-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Low</p>
                  <p className="text-2xl font-bold text-green-400">{formatDuration(confidenceInterval.low)}</p>
                </div>
                <div className="text-gray-500 text-xl">-</div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">High</p>
                  <p className="text-2xl font-bold text-red-400">{formatDuration(confidenceInterval.high)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Based on {records.length} recorded commutes
              </p>
            </>
          ) : (
            <div className="py-8">
              <p className="text-gray-400 text-lg">Needs 5 or more records to show 90% CI</p>
              <p className="text-xs text-gray-500 mt-2">
                Currently {records.length} of 5 required
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="90% Confidence Interval (Nearest Rank)">
        <div className="text-center">
          {confidenceIntervalRank ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                90% of commutes fall within this time range, the closest actual times are used.
              </p>
              <div className="flex justify-center items-center space-x-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Low</p>
                  <p className="text-2xl font-bold text-green-400">{formatDuration(confidenceInterval.low)}</p>
                </div>
                <div className="text-gray-500 text-xl">-</div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">High</p>
                  <p className="text-2xl font-bold text-red-400">{formatDuration(confidenceInterval.high)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Based on {records.length} recorded commutes
              </p>
            </>
          ) : (
            <div className="py-8">
              <p className="text-gray-400 text-lg">Needs 5 or more records to show 90% CI</p>
              <p className="text-xs text-gray-500 mt-2">
                Currently {records.length} of 5 required
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Total Commute Time">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Per Day */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Per Day</p>
            <p className="text-2xl font-bold text-cyan-400 mb-2">{formatTotalDuration(dayTotal)}</p>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {availableOptions.days.map(day => (
                <option key={day} value={day}>
                  {new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          {/* Per Week */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Per Week</p>
            <p className="text-2xl font-bold text-cyan-400 mb-2">{formatTotalDuration(weekTotal)}</p>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {availableOptions.weeks.map(week => (
                <option key={week} value={week}>
                  Week of {formatWeekLabel(week)}
                </option>
              ))}
            </select>
          </div>

          {/* Per Month */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Per Month</p>
            <p className="text-2xl font-bold text-cyan-400 mb-2">{formatTotalDuration(monthTotal)}</p>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {availableOptions.months.map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          {/* Per Year */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Per Year</p>
            <p className="text-2xl font-bold text-cyan-400 mb-2">{formatTotalDuration(yearTotal)}</p>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {availableOptions.years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Total */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Total Time</p>
            <p className="text-2xl font-bold text-cyan-400">{formatTotalDuration(totalTime)}</p>
            <p className="text-xs text-gray-500 mt-2">Since start</p>
          </div>
        </div>
      </Card>

      <Card title="Commute Duration Distribution">
         <div className="h-64 md:h-80">
           <HistogramChart records={records} binSizeMinutes={binSize} />
         </div>
         <div className="flex items-center justify-center mt-4 space-x-2">
            <label htmlFor="binSize" className="text-sm text-gray-400">Bin Size (minutes):</label>
            <select
                id="binSize"
                value={binSize}
                onChange={(e) => setBinSize(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
            </select>
        </div>
      </Card>

      <Card title="Time of Day Breakdown">
          <div className="h-64 md:h-80">
            <TimeBreakdownView records={records} />
          </div>
      </Card>
      
      <Card title="Export Data">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <p className="text-gray-400 flex-grow text-center sm:text-left mb-4 sm:mb-0">Export your commute history as a CSV or a PDF summary report.</p>
            <div className="flex gap-4 flex-shrink-0">
                <Button onClick={handleExportCSV}>Export to CSV</Button>
                <Button onClick={handleExportPDF}>Export to PDF</Button>
            </div>
        </div>
      </Card>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-cyan-400">{value}</p>
  </div>
);
