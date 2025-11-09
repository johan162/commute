/**
 * Compute score for confidence interval forecast with comprehensive penalty system
 * (Very) loosely based on Brier scoring principles
 * JP 2025-11-04
 * 
 * SCORING ALGORITHM DETAILS:
 * ==========================
 * 
 * The scoring system evaluates the quality of a confidence interval prediction using five components:
 * 
 * 1. PRECISION PENALTY (Base Score)
 *    - Measures how close estimated bounds are to the actual sample 90% CI
 *    - Calculate sample 5th percentile (p5) and 95th percentile (p95)
 *    - Penalty = (estimated_low - p5)² + (estimated_high - p95)²
 *    - This measures estimation skill, not inherent commute variability
 *    - Fair: people with variable commutes aren't penalized for having wide intervals
 * 
 * 2. MISS PENALTY
 *    - For each data point outside the interval, calculate squared distance from nearest bound
 *    - Sort all miss penalties and discard the smallest 10% (coverage tolerance)
 *    - Compute average of remaining miss penalties across all data points
 *    - This directly penalizes points that fall outside the interval
 * 
 * 3. OVERCOVERAGE PENALTY (Prevents Gaming with Wide Intervals)
 *    - Calculate actual coverage: percentage of data points within the interval
 *    - Target coverage is always 90% (we ask for a 90% CI)
 *    - If actual coverage exceeds 95%:
 *      * excessCoverage = actualCoverage - 90
 *      * penalty = (excessCoverage / 10)² × intervalWidth × 0.5
 *    - This quadratically penalizes intervals that are unnecessarily wide
 *    - The penalty scales with interval width, making wasteful intervals very expensive
 * 
 * 4. CONFIDENCE CALIBRATION PENALTY (Rewards Honest Self-Assessment of Quality)
 *    - Confidence = "How confident are you this is a true 90% CI?"
 *    - Perfect 90% CI has exactly 10% outside (regardless of balance)
 *    - Calculate coverage deviation: |percentOutside - 10%|
 *    - Map coverage deviation to ideal confidence: idealConfidence = 10 - (coverageDeviation / 10)
 *      * 0% deviation (10% outside) → ideal confidence = 10
 *      * 20% deviation (30% outside) → ideal confidence = 8
 *      * 50% deviation (60% outside) → ideal confidence = 5
 *    - Calculate mismatch: |confidence - idealConfidence|
 *    - Special case: confidence=10 requires truly perfect interval
 *      * Coverage deviation < 1% AND tailImbalance < 2%
 *      * If confidence=10 but not perfect/balanced, apply heavy penalty (3.0× multiplier)
 *    - Normal penalty = (mismatch / 5)² × intervalWidth × 2.0
 * 
 * 5. BALANCE PENALTY (Ensures Symmetry in Tails)
 *    - Perfect 90% CI has 5% in each tail
 *    - Calculate tail imbalance: |percentBelow - 5%| + |percentAbove - 5%|
 *    - Penalty = (tailImbalance / 10)² × intervalWidth × 1.0
 *    - This is applied regardless of confidence level
 *    - Ensures balanced intervals are always preferred
 *    - Examples:
 *      * 5% below, 5% above: imbalance=0 → no penalty (perfect balance!)
 *      * 3% below, 7% above: imbalance=4% → moderate penalty
 *      * 2% below, 8% above: imbalance=6% → larger penalty
 *      * 0% below, 10% above: imbalance=10% → maximum penalty (very unbalanced)
 *      * 10% below, 10% above + confidence=8: totalDeviation≈20 → minimal penalty (honest)
 * 
 * FINAL SCORE = intervalWidth + missPenalty + overcoveragePenalty + calibrationPenalty + balancePenalty
 * 
 * Lower scores are better. The optimal strategy is to:
 * - Choose a narrow interval (minimize base width)
 * - Match your claimed confidence to actual coverage (be well-calibrated)
 * - Ensure it captures the right percentage of data (match target coverage)
 * - Minimize misses while avoiding excessive conservatism
 * 
 * MATHEMATICAL FORMULATION:
 * ==========================
 * 
 * Given:
 * - Interval bounds: [L, H] where L = low, H = high
 * - Data points: x₁, x₂, ..., xₙ (sorted)
 * - Confidence level: c ∈ [5, 10]
 * 
 * Sample percentiles:
 * 
 *   p₅ = x[⌊0.05·n⌋]  (5th percentile)
 *   p₉₅ = x[⌊0.95·n⌋] (95th percentile)
 * 
 * Precision penalty (measures estimation accuracy):
 * 
 *   P_precision = (L - p₅)² + (H - p₉₅)²
 * 
 * Define miss for each point:
 * 
 *           { (L - xᵢ)²  if xᵢ < L
 *   m(xᵢ) = { (xᵢ - H)²  if xᵢ > H
 *           { 0          if L ≤ xᵢ ≤ H
 * 
 * Let M = {m(xᵢ) : m(xᵢ) > 0} be the set of non-zero misses, sorted in ascending order.
 * Let M' = M[⌊0.1|M|⌋:] be M with smallest 10% removed.
 * 
 * Miss penalty:
 * 
 *   P_miss = (1/n) ∑(m ∈ M') m
 * 
 * Coverage calculation:
 * 
 *   Coverage_actual = (100/n) · |{xᵢ : L ≤ xᵢ ≤ H}|
 *   Coverage_target = 90
 * 
 * Overcoverage penalty:
 * 
 *   P_over = { 0.5 · (H - L) · ((Coverage_actual - 90)/10)²  if Coverage_actual > 95
 *            { 0                                              otherwise
 * 
 * Confidence calibration penalty:
 * 
 *   PercentBelow = (100/n) · |{xᵢ : xᵢ < L}|
 *   PercentAbove = (100/n) · |{xᵢ : xᵢ > H}|
 *   PercentOutside = PercentBelow + PercentAbove
 *   CoverageDeviation = |PercentOutside - 10|
 *   IdealConfidence = max(5, 10 - CoverageDeviation/10)
 *   Mismatch = |c - IdealConfidence|
 *   TailImbalance = |PercentBelow - 5| + |PercentAbove - 5|
 *   
 *   Special case for c = 10:
 *   TotalDeviation = CoverageDeviation + TailImbalance
 *   P_calib = { 3.0 · (H - L) · (TotalDeviation/5)²     if CoverageDeviation > 1 or TailImbalance > 2
 *             { 2.0 · (H - L) · (Mismatch/5)²           otherwise
 * 
 * Balance penalty:
 * 
 *   P_balance = 1.0 · (H - L) · (TailImbalance/10)²
 * 
 * Final score:
 * 
 *   Score = P_precision + P_miss + P_over + P_calib + P_balance
 * 
 * @param low - Lower bound of interval (in seconds)
 * @param high - Upper bound of interval (in seconds)
 * @param records - Array of observed travel times (in seconds)
 * @param confidence - Confidence score (5–10), maps to target coverage percentage
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
  const cutoff = Math.floor(misses.length * (100-targetCoverage)/100);
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
  // - 0 deviation (right total) → confidence=10
  // - 20 deviation → confidence=8
  // - 50 deviation → confidence=5
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

/**
 * Generate checksum for verification
 * Uses a simple hash function combining low, high, score, and confidence
 * 
 * @param low - Lower bound
 * @param high - Upper bound
 * @param score - Calculated score
 * @param confidence - Confidence level (5-10)
 * @returns Checksum string
 */
export function generateChecksum(low: number, high: number, score: number, confidence: number): string {

  const roundedScore = Math.round(score);
  const roundedHigh = Math.round(high);
  const roundedLow = Math.round(low);
  const roundedConfidence = Math.round(confidence);

  // Create a deterministic hash from the four values
  const combined = `${roundedLow}_${roundedHigh}_${roundedScore}_${roundedConfidence}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and take last 8 characters
  const hexHash = Math.abs(hash).toString(16).toUpperCase();
  return hexHash.padStart(8, '0').slice(-8);
}

/**
 * Verify checksum
 * 
 * @param low - Lower bound
 * @param high - Upper bound
 * @param score - Calculated score
 * @param confidence - Confidence level (5-10)
 * @param checksum - Checksum to verify
 * @returns True if checksum is valid
 */
export function verifyChecksum(
  low: number,
  high: number,
  score: number,
  confidence: number,
  checksum: string
): boolean {
  return generateChecksum(low, high, score, confidence) === checksum.toUpperCase();
}

/**
 * Hash Function in Excel VBA to verify data externally 
 * Generate checksum for verification
 * Uses a simple hash function combining low, high, score, and confidence
 *
 * @param low - Lower bound in minutes
 * @param high - Upper bound in minutes
 * @param score - Calculated score
 * @param confidence - Confidence level (5-10)
 * @returns Checksum string
 */
/* 
Function GenerateChecksum(low As Double, high As Double, score As Double, confidence As Double) As String
    On Error GoTo ErrorHandler
    
    Dim roundedLow As String
    Dim roundedHigh As String
    Dim roundedScore As String
    Dim roundedConfidence As String
    Dim combined As String
    Dim hash As Long  ' Use Long directly
    Dim i As Long
    Dim charCode As Long
    Dim temp As Double
    
    ' Convert minutes to seconds and round to integers
    roundedLow = CStr(Round(low * 60, 0))
    roundedHigh = CStr(Round(high * 60, 0))
    roundedScore = CStr(Round(score, 0))
    roundedConfidence = CStr(Round(confidence, 0))
    
    ' Create combined string (format: "low_high_score_confidence")
    combined = roundedLow & "_" & roundedHigh & "_" & roundedScore & "_" & roundedConfidence
    
    ' Calculate hash
    hash = 0
    For i = 1 To Len(combined)
        charCode = Asc(Mid(combined, i, 1))
        
        ' Use temp Double to calculate, then force to Long with overflow wrapping
        temp = CDbl(hash) * 32# - CDbl(hash) + CDbl(charCode)
        
        ' Simulate JavaScript's automatic 32-bit wrapping
        ' Convert back to Long, which will wrap automatically on overflow
        On Error Resume Next
        hash = CLng(temp)
        If Err.Number <> 0 Then
            ' Manual wrapping if CLng fails
            Err.Clear
            Do While temp > 2147483647#
                temp = temp - 4294967296#
            Loop
            Do While temp < -2147483648#
                temp = temp + 4294967296#
            Loop
            hash = CLng(temp)
        End If
        On Error GoTo ErrorHandler
    Next i
    
    ' Convert to hex
    Dim hexStr As String
    If hash < 0 Then
        ' For negative numbers, convert to unsigned representation
        hexStr = Hex(hash And &H7FFFFFFF Or &H80000000)
    Else
        hexStr = Hex(hash)
    End If
    
    ' Pad and take last 8 characters
    hexStr = Right(String(8, "0") & UCase(hexStr), 8)
    
    GenerateChecksum = hexStr
    Exit Function

    */