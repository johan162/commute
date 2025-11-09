/**
 * Compute score for confidence interval forecast.
 * 
 * @param low - Lower bound of interval (in seconds)
 * @param high - Upper bound of interval (in seconds)
 * @param records - Array of observed travel times (in seconds)
 * @param confidence - Confidence score (5-10), maps to target coverage percentage
 * @returns Final score (lower is better)
 */
export function computeScore(
  low: number,
  high: number,
  records: number[],
  confidence: number
): number {
  const intervalWidth = high - low;
  const N = records.length;

  // Calculate sample percentiles for precision penalty
  const sortedRecords = [...records].sort((a, b) => a - b);
  const p5Index = Math.floor(N * 0.05);
  const p95Index = Math.floor(N * 0.95);
  const p5 = sortedRecords[p5Index];
  const p95 = sortedRecords[p95Index];

  // Precision penalty: how close are the estimates to the actual sample 90% CI?
  const precisionPenalty = Math.pow(low - p5, 2) + Math.pow(high - p95, 2);

  // Collect squared misses and count coverage per tail
  const misses: number[] = [];
  let captured = 0;
  let belowCount = 0;
  let aboveCount = 0;
  
  for (const x of records) {
    if (x < low) {
      misses.push(Math.pow(low - x, 2));
      belowCount++;
    } else if (x > high) {
      misses.push(Math.pow(x - high, 2));
      aboveCount++;
    } else {
      captured++;
    }
  }

  // Calculate actual coverage percentage and tail percentages
  const actualCoverage = (captured / N) * 100;
  const percentBelow = (belowCount / N) * 100;
  const percentAbove = (aboveCount / N) * 100;
  
  // We always ask for a 90% CI
  const targetCoverage = 90;

  // Sort misses and ignore first 10% (coverage tolerance)
  misses.sort((a, b) => a - b);
  const cutoff = Math.floor(misses.length * 0.10);
  const trimmedMisses = misses.slice(cutoff);

  // Compute penalty for misses
  const missPenalty = trimmedMisses.length > 0
    ? trimmedMisses.reduce((sum, val) => sum + val, 0) / N
    : 0;

  // Overcoverage penalty: penalize intervals that are too wide
  // If actual coverage exceeds target by more than 5%, add penalty
  let overcoveragePenalty = 0;
  if (actualCoverage > targetCoverage + 5) {
    const excessCoverage = actualCoverage - targetCoverage;
    // Penalty scales quadratically with excess coverage
    // Multiply by interval width to make it proportional to how wasteful the interval is
    overcoveragePenalty = Math.pow(excessCoverage / 10, 2) * intervalWidth * 0.5;
  }

  // Confidence calibration penalty: confidence should reflect quality of the 90% CI estimate
  // Perfect 90% CI has 10% outside with 5% in each tail (balanced)
  // Confidence represents: "How confident are you this is a true 90% CI?"
  // 
  // Check both the total percentage outside AND the balance between tails
  const percentOutside = percentBelow + percentAbove;
  
  // For a perfect 90% CI, each tail should be ~5%
  const tailImbalance = Math.abs(percentBelow - 5) + Math.abs(percentAbove - 5);
  
  // Calculate deviation from perfect 10% outside
  const coverageDeviation = Math.abs(percentOutside - 10);
  
  // Map coverage deviation to ideal confidence (ignoring balance for now)
  // - 0 deviation (right total) -> confidence=10
  // - 20 deviation -> confidence=8
  // - 50 deviation -> confidence=5
  const idealConfidence = Math.max(5, 10 - coverageDeviation / 10);
  const confidenceMismatch = Math.abs(confidence - idealConfidence);
  
  // Calibration penalty based on confidence mismatch
  let calibrationPenalty;
  
  // Special case: confidence=10 means "I'm certain this is perfect"
  // Require both low coverage deviation AND balanced tails
  if (confidence === 10 && (coverageDeviation > 1.0 || tailImbalance > 2.0)) {
    // Claiming perfection when not perfect or unbalanced: heavy penalty
    const totalDeviation = coverageDeviation + tailImbalance;
    calibrationPenalty = Math.pow(totalDeviation / 5, 2) * intervalWidth * 3.0;
  } else {
    // Normal case: penalize confidence mismatch
    calibrationPenalty = Math.pow(confidenceMismatch / 5, 2) * intervalWidth * 2.0;
  }
  
  // Add separate penalty for tail imbalance (regardless of confidence)
  // This ensures balanced intervals are always preferred
  const balancePenalty = Math.pow(tailImbalance / 10, 2) * intervalWidth * 1.0;

  // Final score = precision penalty + miss penalty + overcoverage penalty + calibration penalty + balance penalty
  const score = precisionPenalty + missPenalty + overcoveragePenalty + calibrationPenalty + balancePenalty;

  console.log(`Score: ${score.toFixed(0)}, Precision: ${precisionPenalty.toFixed(0)}, Coverage: ${actualCoverage.toFixed(1)}% (target: ${targetCoverage}%), p5=${p5.toFixed(0)}, p95=${p95.toFixed(0)}`);
  return Math.round(score);
}
