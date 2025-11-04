import React, { useState, useEffect, useMemo } from 'react';
import type { CommuteRecord } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { computeScore, generateChecksum } from '../services/scoringService';
import { getMedian } from '../services/statsService';

interface ChallengeViewProps {
  records: CommuteRecord[];
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};

const formatMinutes = (seconds: number): string => {
  return (seconds / 60).toFixed(1);
};

export const ChallengeView: React.FC<ChallengeViewProps> = ({ records }) => {
  const [lowEstimate, setLowEstimate] = useState<string>('');
  const [highEstimate, setHighEstimate] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(9);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [checksum, setChecksum] = useState<string>('');
  const [coverageStats, setCoverageStats] = useState<{ below: number; within: number; above: number } | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const hasMinimumRecords = records.length >= 20;
  const durations = useMemo(() => records.map(r => r.duration), [records]);

  // Calculate score whenever estimates change or new records are available
  useEffect(() => {
    const low = parseInt(lowEstimate);
    const high = parseInt(highEstimate);

    if (
      !isNaN(low) &&
      !isNaN(high) &&
      low > 0 &&
      high > low &&
      hasMinimumRecords
    ) {
      // Convert minutes to seconds for calculation
      const lowSeconds = low * 60;
      const highSeconds = high * 60;

      const score = computeScore(lowSeconds, highSeconds, durations, confidence);
      setCalculatedScore(score);
      
      // Calculate coverage statistics
      let below = 0;
      let within = 0;
      let above = 0;
      
      durations.forEach(duration => {
        if (duration < lowSeconds) {
          below++;
        } else if (duration > highSeconds) {
          above++;
        } else {
          within++;
        }
      });
      
      setCoverageStats({ below, within, above });
      
      // Generate checksum
      const cs = generateChecksum(lowSeconds, highSeconds, score, confidence);
      setChecksum(cs);
    } else {
      setCalculatedScore(null);
      setChecksum('');
      setCoverageStats(null);
    }
  }, [lowEstimate, highEstimate, durations, hasMinimumRecords, confidence]);

  const handleLowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLowEstimate(e.target.value);
  };

  const handleHighChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHighEstimate(e.target.value);
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 5 && value <= 10) {
      setConfidence(value);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!calculatedScore || !checksum || !lowEstimate || !highEstimate) return;
    
    // Create CSV row: Low,High,Confidence,NumCommutes,Score,Checksum
    const csvRow = `${lowEstimate},${highEstimate},${confidence},${records.length},${calculatedScore},${checksum}`;
    
    try {
      await navigator.clipboard.writeText(csvRow);
      setCopySuccess(true);
      
      // Reset success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers or when clipboard API is not available
      alert('Failed to copy to clipboard. Your data: ' + csvRow);
    }
  };

  // Get some statistics for reference
  const stats = useMemo(() => {
    if (durations.length === 0) return null;
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: getMedian(durations),
      p5: sorted[Math.floor(sorted.length * 0.05)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }, [durations]);

  return (
    <div className="space-y-6">
      <Card title="🏆 90% Confidence Interval Challenge">
        <div className="space-y-6">
          <div className="text-gray-300">
            <h3 className="text-xl font-bold text-cyan-400 mb-3">
              Test Your Estimation Skills!
            </h3>
            <p className="mb-4">
              Can you accurately predict your 90% confidence interval for commute times?
              Enter your estimated lower and upper bounds (in minutes), and we'll calculate
              how well your prediction matches reality.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              A 90% confidence interval means that 90% of your commutes should fall within
              this range. The score rewards narrow intervals with good coverage!
            </p>
          </div>

          {!hasMinimumRecords && (
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ You need at least 20 commute records to participate in the challenge.
                Currently, you have <strong>{records.length}</strong> record{records.length !== 1 ? 's' : ''}.
                Keep tracking your commutes!
              </p>
            </div>
          )}

          {hasMinimumRecords && stats && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                📊 Your Commute Statistics (for reference)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">Min:</span>
                  <span className="text-cyan-400 font-mono">
                    {formatDuration(stats.min)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">5th %ile:</span>
                  <span className="text-cyan-400 font-mono">
                    {formatDuration(stats.p5)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">Median:</span>
                  <span className="text-cyan-400 font-mono">
                    {formatDuration(stats.median)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">95th %ile:</span>
                  <span className="text-cyan-400 font-mono">
                    {formatDuration(stats.p95)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">Max:</span>
                  <span className="text-cyan-400 font-mono">
                    {formatDuration(stats.max)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-800 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-300 mb-4">
              Your 90% Confidence Interval Estimate
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="lowEstimate" className="block text-sm font-medium text-gray-300 mb-2">
                  Lower Bound (minutes)
                </label>
                <input
                  id="lowEstimate"
                  type="number"
                  step="0.5"
                  min="0"
                  value={lowEstimate}
                  onChange={handleLowChange}
                  placeholder="e.g., 18"
                  disabled={!hasMinimumRecords}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="highEstimate" className="block text-sm font-medium text-gray-300 mb-2">
                  Upper Bound (minutes)
                </label>
                <input
                  id="highEstimate"
                  type="number"
                  step="0.5"
                  min="0"
                  value={highEstimate}
                  onChange={handleHighChange}
                  placeholder="e.g., 35"
                  disabled={!hasMinimumRecords}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="confidence" className="block text-sm font-medium text-gray-300 mb-2">
                Confidence Level (5-10)
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="confidence"
                  type="range"
                  min="5"
                  max="10"
                  step="1"
                  value={confidence}
                  onChange={handleConfidenceChange}
                  disabled={!hasMinimumRecords}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-cyan-400 font-bold text-2xl w-12 text-center">
                  {confidence}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Higher confidence values increase penalties for misses. Start with 9 for standard 90% confidence interval.
              </p>
            </div>

            {lowEstimate && highEstimate && parseFloat(highEstimate) <= parseFloat(lowEstimate) && (
              <p className="mt-3 text-red-400 text-sm">
                ⚠️ Upper bound must be greater than lower bound
              </p>
            )}
          </div>

          {calculatedScore !== null && hasMinimumRecords && (
            <div className="bg-gradient-to-br from-cyan-900 to-blue-900 border-2 border-cyan-500 rounded-lg p-6 shadow-lg">
              <h4 className="text-2xl font-bold text-white mb-2 text-center">
                Your Challenge Score
              </h4>
              <div className="text-center">
                <div className="text-6xl font-bold text-cyan-300 mb-2">
                  {calculatedScore}
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Lower scores are better! This combines interval width and prediction accuracy.
                </p>
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Interval:</span>
                    <span className="text-white font-mono">
                      {formatMinutes(parseFloat(lowEstimate) * 60)}m - {formatMinutes(parseFloat(highEstimate) * 60)}m
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Width:</span>
                    <span className="text-white font-mono">
                      {(parseFloat(highEstimate) - parseFloat(lowEstimate)).toFixed(1)} minutes
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-white font-mono">
                      {confidence}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Based on:</span>
                    <span className="text-white font-mono">
                      {records.length} commutes
                    </span>
                  </div>
                  {coverageStats && (
                    <>
                      <div className="border-t border-gray-700 my-3"></div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Below interval:</span>
                        <span className="text-white font-mono">
                          {coverageStats.below} ({((coverageStats.below / records.length) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Within interval:</span>
                        <span className="text-green-400 font-mono font-semibold">
                          {coverageStats.within} ({((coverageStats.within / records.length) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Above interval:</span>
                        <span className="text-white font-mono">
                          {coverageStats.above} ({((coverageStats.above / records.length) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {checksum && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                🔒 Verification Checksum
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                 Share your score and checksum together to avoid mistakes! Click the copy button!
              </p>
              <div className="bg-gray-900 rounded p-3 font-mono text-center mb-3">
                <span className="text-gray-400 text-sm">Checksum: </span>
                <span className="text-cyan-400 text-lg font-bold tracking-wider">
                  {checksum}
                </span>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  {copySuccess ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      Copy CSV Data
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Format: Low,High,Confidence,NumCommutes,Score,Checksum
              </p>
            </div>
          )}

          <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">
              💡 Scoring System
            </h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>Narrower intervals</strong> are rewarded with lower scores</li>
              <li>• <strong>Penalties</strong> are applied for commutes outside your interval</li>
              <li>• Misses are penalized with squared distance from interval bounds (Brier Scoring)</li>
              <li>• Your score updates automatically as you add more commutes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
