
import React, { useState, useMemo } from 'react';
import type { CommuteRecord } from '../types';
import { Card } from './Card';
import { HistogramChart } from './HistogramChart';
import { TimeBreakdownView } from './TimeBreakdownView';
import { exportToCSV, exportToPDF } from '../services/exportService';
import { getConfidenceInterval, getConfidenceIntervalRank, shapiroWilkTest, mannKendallTest, runsTest, getMean, getMedian, generateQQPlotData } from '../services/statsService';
import { Button } from './Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, LineChart, Line, ReferenceLine } from 'recharts';

interface StatsViewProps {
  records: CommuteRecord[];
  stats: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
  } | null;
  includeWeekends: boolean;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};

export const StatsView: React.FC<StatsViewProps> = ({ records, stats, includeWeekends }) => {
  const [binSize, setBinSize] = useState(5); // bin size in minutes
  const [weekdayMetric, setWeekdayMetric] = useState<'mean' | 'median'>('median');
  
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

  // Calculate Shapiro-Wilk test for normality
  const normalityTest = useMemo(() => {
    if (records.length < 20) return null;
    const durations = records.map(record => record.duration);
    return shapiroWilkTest(durations);
  }, [records]);

  // Generate Q-Q plot data
  const qqPlotData = useMemo(() => {
    if (records.length < 10) return null;
    const durations = records.map(record => record.duration);
    const qqData = generateQQPlotData(durations);
    
    // Calculate smart tick intervals
    const theoreticalValues = qqData.map(d => d.theoretical);
    const observedValues = qqData.map(d => d.observed);
    const minTheoretical = Math.min(...theoreticalValues);
    const maxTheoretical = Math.max(...theoreticalValues);
    const minObserved = Math.min(...observedValues);
    const maxObserved = Math.max(...observedValues);
    
    // Function to generate nice tick intervals
    const generateNiceTicks = (min: number, max: number) => {
      const range = max - min;
      let interval: number;
      
      if (range <= 2) interval = 0.2;
      else if (range <= 4) interval = 0.5;
      else interval = 1.0;
      
      const start = Math.floor(min / interval) * interval;
      const end = Math.ceil(max / interval) * interval;
      const ticks = [];
      
      for (let i = start; i <= end; i += interval) {
        ticks.push(Math.round(i / interval) * interval); // Avoid floating point errors
      }
      return ticks;
    };
    
    const theoreticalTicks = generateNiceTicks(minTheoretical, maxTheoretical);
    const observedTicks = generateNiceTicks(minObserved, maxObserved);
    
    // Create reference line data (y = x) with multiple points for a smooth line
    const minValue = Math.min(...qqData.map(d => Math.min(d.theoretical, d.observed)));
    const maxValue = Math.max(...qqData.map(d => Math.max(d.theoretical, d.observed)));
    const numLinePoints = 30; // Create 30 points for a smooth line
    const referenceLine = [];
    
    for (let i = 0; i < numLinePoints; i++) {
      const t = i / (numLinePoints - 1); // Parameter from 0 to 1
      const value = minValue + t * (maxValue - minValue);
      referenceLine.push({
        theoretical: value,
        observed: value,
        isReferenceLine: true
      });
    }
    
    return {
      data: qqData.map(d => ({ ...d, isReferenceLine: false })),
      referenceLine,
      theoreticalTicks,
      observedTicks
    };
  }, [records]);

  // Calculate Mann-Kendall trend test
  const trendTest = useMemo(() => {
    if (records.length < 10) return null;
    const durations = records.map(record => record.duration);
    return mannKendallTest(durations);
  }, [records]);

  // Calculate Runs test for randomness
  const randomnessTest = useMemo(() => {
    if (records.length < 10) return null;
    const durations = records.map(record => record.duration);
    return runsTest(durations);
  }, [records]);

  // Calculate weekday statistics
  const weekdayData = useMemo(() => {
    const daysOfWeek = includeWeekends 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    const dayMap: { [key: string]: number[] } = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
    };

    records.forEach(record => {
      const date = new Date(record.date);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dayIndex];
      
      if (dayMap[dayName]) {
        dayMap[dayName].push(record.duration);
      }
    });

    return daysOfWeek.map(day => {
      const durations = dayMap[day];
      if (durations.length === 0) {
        return {
          day,
          value: 0,
          count: 0
        };
      }
      
      const value = weekdayMetric === 'mean' 
        ? getMean(durations) 
        : getMedian(durations);
      
      return {
        day,
        value: value / 60, // Convert to minutes for display
        count: durations.length
      };
    });
  }, [records, includeWeekends, weekdayMetric]);

  // Create a string "Statistics Summary" with added number of records
  const statsSummary = `Statistics Summary - ${records.length} records`;

  return (
    <div className="space-y-6">
      <Card title={statsSummary}>
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
                  <p className="text-2xl font-bold text-green-400">{formatDuration(confidenceIntervalRank.low)}</p>
                </div>
                <div className="text-gray-500 text-xl">-</div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">High</p>
                  <p className="text-2xl font-bold text-red-400">{formatDuration(confidenceIntervalRank.high)}</p>
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

      <Card title="Normality Test (Shapiro-Wilk)">
        <div className="text-center">
          {normalityTest ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Tests whether commute times follow a normal (bell curve) distribution
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">W Statistic</p>
                  <p className="text-2xl font-bold text-cyan-400">{normalityTest.W.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">Range: 0-1 (closer to 1 = more normal)</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">p-value</p>
                  <p className="text-2xl font-bold text-cyan-400">{normalityTest.pValue.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">Significance threshold: 0.05</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Distribution</p>
                  <p className={`text-2xl font-bold ${normalityTest.isNormal ? 'text-green-400' : 'text-yellow-400'}`}>
                    {normalityTest.isNormal ? '✓ Normal' : '⚠ Not Normal'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {normalityTest.isNormal ? 'Data fits normal distribution' : 'Data deviates from normal'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-left">
                <p className="text-sm font-semibold text-gray-300 mb-2">Interpretation:</p>
                <p className="text-xs text-gray-400 mb-2">
                  {normalityTest.isNormal ? (
                    <>
                      <span className="text-green-400">✓</span> Your commute times appear to follow a normal distribution 
                      (p &gt; 0.05). This suggests that most of your commutes cluster around the average, with fewer 
                      extremely short or long commutes. Statistical methods assuming normality are appropriate for your data.
                    </>
                  ) : (
                    <>
                      <span className="text-yellow-400">⚠</span> Your commute times do not follow a normal distribution 
                      (p ≤ 0.05). This could indicate consistent factors affecting your commute (traffic patterns, weather, 
                      route changes) or the presence of outliers. Consider using non-parametric statistical methods.
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {records.length} recorded commutes • α = 0.05 significance level
                </p>
              </div>
            </>
          ) : (
            <div className="py-8">
              <p className="text-gray-400 text-lg">Needs 20 or more records for normality test</p>
              <p className="text-xs text-gray-500 mt-2">
                Currently {records.length} of 20 required
              </p>
              <p className="text-xs text-gray-500 mt-4">
                The Shapiro-Wilk test is most reliable with at least 20 samples
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Q-Q Plot (Quantile-Quantile)">
        <div className="text-center">
          {qqPlotData ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Visual assessment of normality - points should follow the diagonal line if data is normally distributed
              </p>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={[...qqPlotData.data, ...qqPlotData.referenceLine]} margin={{ top: 20, right: 20, left: 35, bottom: 35 }}>
                    {/* Manual grid lines using ReferenceLine for precise positioning */}
                    {qqPlotData.theoreticalTicks.map((tick: number) => (
                      <ReferenceLine 
                        key={`vertical-${tick}`}
                        x={tick} 
                        stroke="#374151" 
                        strokeDasharray="3 3" 
                        strokeWidth={1}
                      />
                    ))}
                    {qqPlotData.observedTicks.map((tick: number) => (
                      <ReferenceLine 
                        key={`horizontal-${tick}`}
                        y={tick} 
                        stroke="#374151" 
                        strokeDasharray="3 3" 
                        strokeWidth={1}
                      />
                    ))}
                    <XAxis 
                      type="number"
                      dataKey="theoretical"
                      stroke="#9CA3AF"
                      style={{ fontSize: '0.875rem' }}
                      label={{ value: 'Theoretical Quantiles (Standard Normal)', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF', fontSize: '0.8rem' } }}
                      domain={[qqPlotData.theoreticalTicks[0], qqPlotData.theoreticalTicks[qqPlotData.theoreticalTicks.length - 1]]}
                      ticks={qqPlotData.theoreticalTicks}
                      axisLine={true}
                      tickLine={true}
                      tickFormatter={(value: number) => {
                        // Format based on whether it's a whole number or decimal
                        return value % 1 === 0 ? value.toString() : value.toFixed(1);
                      }}
                    />
                    <YAxis 
                      type="number"
                      dataKey="observed"
                      stroke="#9CA3AF"
                      style={{ fontSize: '0.875rem' }}
                      label={{ value: 'Sample Quantiles (Standardized)', angle: -90, position: 'outside', offset: -15, style: { fill: '#9CA3AF', textAnchor: 'middle', fontSize: '0.8rem' } }}
                      domain={[qqPlotData.observedTicks[0], qqPlotData.observedTicks[qqPlotData.observedTicks.length - 1]]}
                      ticks={qqPlotData.observedTicks}
                      axisLine={true}
                      tickLine={true}
                      tickFormatter={(value: number) => {
                        // Format based on whether it's a whole number or decimal
                        return value % 1 === 0 ? value.toString() : value.toFixed(1);
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#F3F4F6'
                      }}
                      formatter={(value: number, name: string) => [
                        value.toFixed(3),
                        name === 'theoretical' ? 'Theoretical' : 'Observed'
                      ]}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Scatter 
                      dataKey="observed" 
                      fill="#06B6D4"
                      strokeWidth={1}
                      stroke="#0891B2"
                      shape={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload?.isReferenceLine) {
                          // For reference line points, create a small line segment to connect them
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={1}
                              fill="#EF4444" 
                              stroke="#EF4444"
                            />
                          );
                        }
                        return <circle cx={cx} cy={cy} r={3} fill="#06B6D4" stroke="#0891B2" strokeWidth={1} />;
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-left mt-4">
                <p className="text-sm font-semibold text-gray-300 mb-2">How to interpret this plot:</p>
                <div className="text-xs text-gray-400 space-y-2">
                  <p>
                    <span className="text-red-400">Red dashed line:</span> Perfect normal distribution reference line
                  </p>
                  <p>
                    <span className="text-cyan-400">Blue dots:</span> Your actual commute time data points
                  </p>
                  <p>
                    <strong>If points closely follow the red line:</strong> Your data is approximately normally distributed
                  </p>
                  <p>
                    <strong>If points curve away from the line:</strong> Your data deviates from normality
                  </p>
                  <p>
                    <strong>S-shaped curve:</strong> Data has heavier tails than normal distribution
                  </p>
                  <p>
                    <strong>Reverse S-curve:</strong> Data has lighter tails than normal distribution
                  </p>
                  <p>
                    <strong>Points scattered randomly:</strong> Data may have outliers or multiple modes
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Based on {records.length} standardized commute times
                </p>
              </div>
            </>
          ) : (
            <div className="py-8">
              <p className="text-gray-400 text-lg">Needs 10 or more records for Q-Q plot</p>
              <p className="text-xs text-gray-500 mt-2">
                Currently {records.length} of 10 required
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Q-Q plots are most informative with at least 10 data points
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

      <Card title="Commute Time by Day of Week">
        <div className="text-center">
          {records.length >= 5 ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                {weekdayMetric === 'median' ? 'Median' : 'Average'} commute time for each day
              </p>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#9CA3AF"
                      style={{ fontSize: '0.875rem' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      style={{ fontSize: '0.875rem' }}
                      label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#F3F4F6'
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)} min (${props.payload.count} commutes)`,
                        weekdayMetric === 'median' ? 'Median' : 'Average'
                      ]}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#06B6D4"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center mt-4 space-x-2">
                <label htmlFor="weekdayMetric" className="text-sm text-gray-400">Show:</label>
                <select
                  id="weekdayMetric"
                  value={weekdayMetric}
                  onChange={(e) => setWeekdayMetric(e.target.value as 'mean' | 'median')}
                  className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="median">Median</option>
                  <option value="mean">Average</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                {includeWeekends 
                  ? 'Showing all days of the week. Adjust in Settings to hide weekends.'
                  : 'Showing weekdays only (Mon-Fri). Enable weekends in Settings to see Sat-Sun.'}
              </p>
            </>
          ) : (
            <div className="py-8">
              <p className="text-gray-400 text-lg">Needs 5 or more records for weekly analysis</p>
              <p className="text-xs text-gray-500 mt-2">
                Currently {records.length} of 5 required
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Trend Analysis (Mann-Kendall Test)">
        <div className="text-center">
          {trendTest ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Analyzes whether your commute times are getting longer, shorter, or staying stable over time
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Trend Direction</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {trendTest.trend === 'increasing' && (
                      <>
                        <span className="text-4xl">📈</span>
                        <p className="text-2xl font-bold text-red-400">Getting Longer</p>
                      </>
                    )}
                    {trendTest.trend === 'decreasing' && (
                      <>
                        <span className="text-4xl">📉</span>
                        <p className="text-2xl font-bold text-green-400">Getting Shorter</p>
                      </>
                    )}
                    {trendTest.trend === 'no trend' && (
                      <>
                        <span className="text-4xl">➡️</span>
                        <p className="text-2xl font-bold text-cyan-400">Stable</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {trendTest.trend === 'increasing' && 'Your commute times show an upward trend'}
                    {trendTest.trend === 'decreasing' && 'Your commute times show a downward trend'}
                    {trendTest.trend === 'no trend' && 'No significant trend detected'}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Confidence Level</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {trendTest.significance === 'strong' && (
                      <>
                        <span className="text-4xl">💪</span>
                        <p className="text-2xl font-bold text-green-400">Very Strong</p>
                      </>
                    )}
                    {trendTest.significance === 'moderate' && (
                      <>
                        <span className="text-4xl">👍</span>
                        <p className="text-2xl font-bold text-blue-400">Moderate</p>
                      </>
                    )}
                    {trendTest.significance === 'weak' && (
                      <>
                        <span className="text-4xl">🤔</span>
                        <p className="text-2xl font-bold text-yellow-400">Weak</p>
                      </>
                    )}
                    {trendTest.significance === 'none' && (
                      <>
                        <span className="text-4xl">🤷</span>
                        <p className="text-2xl font-bold text-gray-400">Not Significant</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    p-value: {trendTest.pValue.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-left">
                <p className="text-sm font-semibold text-gray-300 mb-2">What does this mean?</p>
                <p className="text-xs text-gray-400 mb-2">
                  {trendTest.trend === 'increasing' && trendTest.significance !== 'none' && (
                    <>
                      <span className="text-red-400">⚠️</span> Your commute times are trending <strong>upward</strong>. 
                      This could indicate increasing traffic congestion, seasonal changes, or route deterioration. 
                      Consider exploring alternative routes or adjusting your departure time.
                    </>
                  )}
                  {trendTest.trend === 'decreasing' && trendTest.significance !== 'none' && (
                    <>
                      <span className="text-green-400">✓</span> Great news! Your commute times are trending <strong>downward</strong>. 
                      This suggests improvements in traffic flow, better route choices, or favorable seasonal changes. 
                      Keep up whatever you're doing!
                    </>
                  )}
                  {trendTest.trend === 'no trend' && (
                    <>
                      <span className="text-cyan-400">➡️</span> Your commute times remain <strong>stable</strong> over time. 
                      This consistency suggests predictable traffic patterns and reliable route conditions. 
                      Good for planning your schedule!
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {records.length} recorded commutes • Kendall's τ = {trendTest.tau.toFixed(3)}
                </p>
              </div>
            </>
          ) : (
            <div className="py-8">
              <p className="text-gray-400 text-lg">Needs 10 or more records for trend analysis</p>
              <p className="text-xs text-gray-500 mt-2">
                Currently {records.length} of 10 required
              </p>
              <p className="text-xs text-gray-500 mt-4">
                The Mann-Kendall test detects monotonic trends in time series data
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Pattern Analysis (Runs Test)">
        <div className="text-center">
          {randomnessTest ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Detects whether your commute times follow a random pattern or show clustering/oscillation
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Pattern Type</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {randomnessTest.pattern === 'random' && (
                      <>
                        <span className="text-4xl">🎲</span>
                        <p className="text-2xl font-bold text-cyan-400">Random</p>
                      </>
                    )}
                    {randomnessTest.pattern === 'clustered' && (
                      <>
                        <span className="text-4xl">📦</span>
                        <p className="text-2xl font-bold text-orange-400">Clustered</p>
                      </>
                    )}
                    {randomnessTest.pattern === 'oscillating' && (
                      <>
                        <span className="text-4xl">🌊</span>
                        <p className="text-2xl font-bold text-purple-400">Oscillating</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {randomnessTest.pattern === 'random' && 'No predictable pattern detected'}
                    {randomnessTest.pattern === 'clustered' && 'Similar times grouped together'}
                    {randomnessTest.pattern === 'oscillating' && 'Alternating fast/slow pattern'}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Runs Analysis</p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-300">Observed: <span className="font-bold text-cyan-400">{randomnessTest.runs}</span></p>
                    <p className="text-sm text-gray-300">Expected: <span className="font-bold text-gray-400">{randomnessTest.expectedRuns.toFixed(1)}</span></p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {randomnessTest.significance === 'strong' && '(Very Strong Evidence)'}
                    {randomnessTest.significance === 'moderate' && '(Moderate Evidence)'}
                    {randomnessTest.significance === 'weak' && '(Weak Evidence)'}
                    {randomnessTest.significance === 'none' && '(Not Statistically Significant)'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-left">
                <p className="text-sm font-semibold text-gray-300 mb-2">What does this mean?</p>
                <p className="text-xs text-gray-400 mb-2">
                  {randomnessTest.pattern === 'random' && (
                    <>
                      <span className="text-cyan-400">🎲</span> Your commute times appear <strong>random</strong>, 
                      with no clear pattern of clustering or alternation. This is typical when traffic conditions 
                      vary independently from day to day. Each commute is relatively unpredictable.
                    </>
                  )}
                  {randomnessTest.pattern === 'clustered' && (
                    <>
                      <span className="text-orange-400">📦</span> Your commute times show <strong>clustering</strong>, 
                      meaning you tend to have stretches of similar commute times (several fast days followed by 
                      several slow days). This could indicate weekly patterns, weather impacts, or consistent 
                      schedule changes.
                    </>
                  )}
                  {randomnessTest.pattern === 'oscillating' && (
                    <>
                      <span className="text-purple-400">🌊</span> Your commute times show an <strong>oscillating pattern</strong>, 
                      alternating between faster and slower commutes more than expected by chance. This could suggest 
                      alternating schedules, every-other-day traffic patterns, or behavioral factors affecting your timing.
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {records.length} recorded commutes • p-value: {randomnessTest.pValue.toFixed(4)}
                </p>
              </div>
            </>
          ) : (
            <div className="py-8">
              <p className="text-gray-400 text-lg">Needs 10 or more records for pattern analysis</p>
              <p className="text-xs text-gray-500 mt-2">
                Currently {records.length} of 10 required
              </p>
              <p className="text-xs text-gray-500 mt-4">
                The Runs Test detects non-random patterns in sequential data
              </p>
            </div>
          )}
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
