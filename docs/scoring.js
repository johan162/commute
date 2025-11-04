/**
 * Compute score for interval forecast with:
 * - Squared penalty for misses
 * - Confidence as exponent
 * - Ignore first 10% smallest misses (coverage tolerance)
 *
 * Loosely based on Brier scoring principles
 * JP 2025-11-04
 * 
 * @param {number} low - Lower bound of interval
 * @param {number} high - Upper bound of interval
 * @param {number[]} records - Array of observed travel times
 * @param {number} confidence - Confidence score (5–10)
 * @returns {number} Final score (lower is better)
 */
function computeScore(low, high, records, confidence) {
    const intervalWidth = high - low;
    const N = records.length;

    // Collect squared misses
    let misses = [];
    for (let x of records) {
        if (x < low) {
            misses.push(Math.pow(low - x, 2));
        } else if (x > high) {
            misses.push(Math.pow(x - high, 2));
        }
    }

    // Sort misses and ignore first 10% (coverage tolerance)
    misses.sort((a, b) => a - b);
    const cutoff = Math.floor(misses.length * 0.10);
    const trimmedMisses = misses.slice(cutoff);

    // Compute base penalty
    let basePenalty = trimmedMisses.length > 0
        ? trimmedMisses.reduce((sum, val) => sum + val, 0) / N
        : 0;

    // Apply confidence as exponent
    const gamma = 0.5; // sensitivity factor
    const exponent = 1 + gamma * (confidence - 5) / 5;
    const adjustedPenalty = Math.pow(basePenalty, exponent);

    // Final score = interval width + adjusted penalty
    const score = intervalWidth + adjustedPenalty;
    return score;
}

// Example usage:
const low = 20;
const high = 40;
const actuals = [22, 25, 30, 35, 45, 50, 18, 28, 32, 38];
const confidence = 9;

console.log("Score:", computeScore(low, high, actuals, confidence));


