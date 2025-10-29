
export const getMin = (data: number[]): number => {
    if (data.length === 0) return 0;
    return Math.min(...data);
};

export const getMax = (data: number[]): number => {
    if (data.length === 0) return 0;
    return Math.max(...data);
};

export const getMean = (data: number[]): number => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
};

export const getMedian = (data: number[]): number => {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};

export const getStdDev = (data: number[]): number => {
    if (data.length < 2) return 0;
    const mean = getMean(data);
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
};

export const getPercentile = (data: number[], percentile: number): number => {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
        return sorted[index];
    }
    
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const getPercentileNearestRank = (data: number[], percentile: number): number => {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
};

export const getConfidenceInterval = (data: number[], confidenceLevel: number = 90): { low: number; high: number } | null => {
    if (data.length < 5) return null;
    
    const tailPercent = (100 - confidenceLevel) / 2;
    const lowPercentile = tailPercent;
    const highPercentile = 100 - tailPercent;
    
    return {
        low: getPercentile(data, lowPercentile),
        high: getPercentile(data, highPercentile)
    };
};

export const getConfidenceIntervalRank = (data: number[], confidenceLevel: number = 90): { low: number; high: number } | null => {
    if (data.length < 5) return null;
    
    const tailPercent = (100 - confidenceLevel) / 2;
    const lowPercentile = tailPercent;
    const highPercentile = 100 - tailPercent;

    return {
        low: getPercentileNearestRank(data, lowPercentile),
        high: getPercentileNearestRank(data, highPercentile)
    };
};

/**
 * Shapiro-Wilk test for normality
 * Tests the null hypothesis that the data comes from a normal distribution
 * Returns W statistic and p-value
 * Requires minimum of 3 samples, recommended minimum 20 for reliable results
 */
export const shapiroWilkTest = (data: number[]): { W: number; pValue: number; isNormal: boolean } | null => {
    const n = data.length;
    
    // Minimum sample size check
    if (n < 3) return null;
    
    // Sort data
    const sorted = [...data].sort((a, b) => a - b);
    
    // Calculate mean
    const mean = getMean(sorted);
    
    // Calculate S² (sum of squared deviations)
    const ssq = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    if (ssq === 0) {
        // All values are identical - perfectly "normal" but degenerate case
        return { W: 1.0, pValue: 1.0, isNormal: true };
    }
    
    // Calculate expected normal order statistics (m values)
    const m = new Array(n);
    for (let i = 0; i < n; i++) {
        const p = (i + 1 - 0.375) / (n + 0.25);
        m[i] = approximateNormalQuantile(p);
    }
    
    // Calculate m' * m (sum of squares of m)
    const mtm = m.reduce((sum, val) => sum + val * val, 0);
    
    // Calculate 1 / ||m|| (for later use)
    const c = 1 / Math.sqrt(mtm);
    
    // For Shapiro-Wilk, we need to calculate the numerator
    // numerator = (sum of a[i] * x[i])^2
    // where a = m / ||m|| for the full vector approach
    
    // Simple approach: use the correlation between ordered data and expected normal quantiles
    let numerator = 0;
    for (let i = 0; i < n; i++) {
        numerator += m[i] * sorted[i];
    }
    numerator = numerator * numerator * c * c;
    
    // Calculate W statistic
    const W = numerator / ssq;
    
    // W should be in [0, 1]. If slightly out of range due to numerical precision, clamp it
    const WClamped = Math.max(0, Math.min(1, W));
    
    if (Math.abs(W - WClamped) > 0.01) {
        // If W is significantly out of range, something is wrong
        console.error(`Shapiro-Wilk W statistic out of range: ${W}`);
        return null;
    }
    
    // Approximate p-value
    const pValue = approximatePValue(WClamped, n);
    
    // Typically use alpha = 0.05 for significance
    const isNormal = pValue > 0.05;
    
    return { W: WClamped, pValue, isNormal };
};

/**
 * Generate Q-Q plot data for normality assessment
 * Returns paired quantiles: theoretical normal vs. observed sample quantiles
 */
export function generateQQPlotData(data: number[]): Array<{ theoretical: number; observed: number }> {
    const n = data.length;
    if (n < 3) return [];
    
    // Sort the data
    const sorted = [...data].sort((a, b) => a - b);
    
    // Calculate sample mean and standard deviation
    const mean = getMean(sorted);
    const stdDev = getStdDev(sorted);
    
    // Generate plotting positions (theoretical quantiles)
    const qqData: Array<{ theoretical: number; observed: number }> = [];
    
    for (let i = 0; i < n; i++) {
        // Use the (i + 1 - 0.5) / n formula for plotting positions
        const p = (i + 1 - 0.5) / n;
        
        // Get theoretical normal quantile
        const theoreticalZ = approximateNormalQuantile(p);
        
        // Standardize observed values (convert to z-scores)
        const observedZ = (sorted[i] - mean) / stdDev;
        
        qqData.push({
            theoretical: theoreticalZ,
            observed: observedZ
        });
    }
    
    return qqData;
}

/**
 * Calculate R² (coefficient of determination) for Q-Q plot
 * Measures how well the data fits a normal distribution
 * @param qqData Array of Q-Q plot points with theoretical and observed values
 * @returns R² value between 0 and 1 (closer to 1 = better fit to normal distribution)
 */
export function calculateQQPlotRSquared(qqData: Array<{ theoretical: number; observed: number }>): number {
    if (qqData.length < 3) return 0;
    
    // Calculate mean of observed values
    const meanObserved = qqData.reduce((sum, point) => sum + point.observed, 0) / qqData.length;
    
    // Calculate Sum of Squared Residuals (SSR)
    // Distance from each point to the y=x line (theoretical line)
    const ssr = qqData.reduce((sum, point) => {
        const residual = point.observed - point.theoretical;
        return sum + residual * residual;
    }, 0);
    
    // Calculate Total Sum of Squares (SST)
    // Variance of observed values from their mean
    const sst = qqData.reduce((sum, point) => {
        const deviation = point.observed - meanObserved;
        return sum + deviation * deviation;
    }, 0);
    
    // Calculate R²
    // R² = 1 - (SSR / SST)
    if (sst === 0) return 1; // Perfect fit if no variance
    const rSquared = 1 - (ssr / sst);
    
    // Clamp between 0 and 1 (can be negative for very poor fits)
    return Math.max(0, Math.min(1, rSquared));
}

/**
 * Get interpretation of R² value for Q-Q plot
 */
export function getQQPlotRSquaredInterpretation(rSquared: number): {
    rating: string;
    color: string;
    description: string;
} {
    if (rSquared >= 0.99) {
        return {
            rating: 'Excellent',
            color: 'text-green-400',
            description: 'Data fits normal distribution very closely'
        };
    } else if (rSquared >= 0.95) {
        return {
            rating: 'Very Good',
            color: 'text-green-400',
            description: 'Data fits normal distribution well'
        };
    } else if (rSquared >= 0.90) {
        return {
            rating: 'Good',
            color: 'text-blue-400',
            description: 'Data reasonably fits normal distribution'
        };
    } else if (rSquared >= 0.80) {
        return {
            rating: 'Moderate',
            color: 'text-yellow-400',
            description: 'Data shows moderate fit to normal distribution'
        };
    } else if (rSquared >= 0.70) {
        return {
            rating: 'Fair',
            color: 'text-orange-400',
            description: 'Data has fair fit to normal distribution'
        };
    } else {
        return {
            rating: 'Poor',
            color: 'text-red-400',
            description: 'Data does not fit normal distribution well'
        };
    }
}

/**
 * Approximation of inverse normal CDF (quantile function)
 * Uses Beasley-Springer-Moro algorithm
 */
function approximateNormalQuantile(p: number): number {
    const a = [
        -3.969683028665376e+01,
        2.209460984245205e+02,
        -2.759285104469687e+02,
        1.383577518672690e+02,
        -3.066479806614716e+01,
        2.506628277459239e+00
    ];
    
    const b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01
    ];
    
    const c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e+00,
        -2.549732539343734e+00,
        4.374664141464968e+00,
        2.938163982698783e+00
    ];
    
    const d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00
    ];
    
    const pLow = 0.02425;
    const pHigh = 1 - pLow;
    
    if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= pHigh) {
        const q = p - 0.5;
        const r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
               (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
}

/**
 * Approximate p-value for Shapiro-Wilk test using critical value table
 * The test is left-tailed: small W indicates departure from normality
 */
function approximatePValue(W: number, n: number): number {
    if (W <= 0 || W > 1) {
        return 0;
    }
    if (W === 1) {
        return 1.0;
    }

    // Critical values table for Shapiro-Wilk test at different significance levels
    // These are approximate critical values from statistical tables
    const criticalValues: { [key: number]: { p01: number; p05: number; p10: number } } = {
        20: { p01: 0.868, p05: 0.905, p10: 0.918 },
        25: { p01: 0.888, p05: 0.918, p10: 0.928 },
        30: { p01: 0.900, p05: 0.927, p10: 0.935 },
        35: { p01: 0.910, p05: 0.934, p10: 0.941 },
        40: { p01: 0.917, p05: 0.940, p10: 0.945 },
        50: { p01: 0.927, p05: 0.947, p10: 0.951 },
        60: { p01: 0.935, p05: 0.952, p10: 0.956 },
        70: { p01: 0.941, p05: 0.956, p10: 0.959 },
        80: { p01: 0.945, p05: 0.959, p10: 0.962 },
        90: { p01: 0.949, p05: 0.962, p10: 0.964 },
        100: { p01: 0.952, p05: 0.964, p10: 0.966 },
        110: { p01: 0.954, p05: 0.966, p10: 0.967 },
        120: { p01: 0.956, p05: 0.967, p10: 0.969 },
        130: { p01: 0.958, p05: 0.968, p10: 0.970 },
        140: { p01: 0.959, p05: 0.969, p10: 0.971 },
        150: { p01: 0.960, p05: 0.970, p10: 0.972 },
        160: { p01: 0.961, p05: 0.971, p10: 0.973 },
        170: { p01: 0.962, p05: 0.972, p10: 0.974 },
        180: { p01: 0.963, p05: 0.973, p10: 0.974 },
        190: { p01: 0.964, p05: 0.973, p10: 0.975 },
        200: { p01: 0.965, p05: 0.974, p10: 0.975 },
        210: { p01: 0.965, p05: 0.974, p10: 0.976 },
        220: { p01: 0.966, p05: 0.975, p10: 0.976 },
        230: { p01: 0.966, p05: 0.975, p10: 0.977 },
        240: { p01: 0.967, p05: 0.976, p10: 0.977 },
        250: { p01: 0.967, p05: 0.976, p10: 0.978 }
    };

    // Find closest sample size in table
    let closestN = 20;
    let minDiff = Math.abs(n - 20);
    for (const tableN of Object.keys(criticalValues).map(Number)) {
        const diff = Math.abs(n - tableN);
        if (diff < minDiff) {
            minDiff = diff;
            closestN = tableN;
        }
    }

    const cv = criticalValues[closestN];

    // Interpolate p-value based on where W falls relative to critical values
    if (W >= cv.p10) {
        // W is above the 0.10 critical value - p > 0.10
        const range = 1.0 - cv.p10;
        const position = (W - cv.p10) / range;
        return 0.10 + position * 0.90; // Interpolate from 0.10 to 1.0
    } else if (W >= cv.p05) {
        // W is between 0.05 and 0.10 critical values
        const range = cv.p10 - cv.p05;
        const position = (W - cv.p05) / range;
        return 0.05 + position * 0.05; // Interpolate from 0.05 to 0.10
    } else if (W >= cv.p01) {
        // W is between 0.01 and 0.05 critical values
        const range = cv.p05 - cv.p01;
        const position = (W - cv.p01) / range;
        return 0.01 + position * 0.04; // Interpolate from 0.01 to 0.05
    } else {
        // W is below the 0.01 critical value - p < 0.01
        const range = cv.p01;
        const position = W / range;
        return position * 0.01; // Interpolate from 0 to 0.01
    }
}

/**
 * Standard normal cumulative distribution function
 * Approximation using error function
 */
function standardNormalCDF(z: number): number {
    // Using approximation: Φ(z) = 0.5 * (1 + erf(z/sqrt(2)))
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Error function approximation
 * Using Abramowitz and Stegun approximation
 */
function erf(x: number): number {
    // Constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    // Save the sign of x
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
}

/**
 * Mann-Kendall Trend Test
 * Tests for monotonic trend in time series data
 * Returns null if insufficient data (need at least 10 observations)
 */
export function mannKendallTest(data: number[]): {
    S: number;
    tau: number;
    zScore: number;
    pValue: number;
    trend: 'increasing' | 'decreasing' | 'no trend';
    significance: 'strong' | 'moderate' | 'weak' | 'none';
} | null {
    const n = data.length;
    
    // Need at least 10 observations for meaningful results
    if (n < 10) {
        return null;
    }
    
    // Calculate S statistic
    let S = 0;
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            const diff = data[j] - data[i];
            if (diff > 0) S++;
            else if (diff < 0) S--;
        }
    }
    
    // Calculate Kendall's tau
    const tau = (2 * S) / (n * (n - 1));
    
    // Calculate variance of S
    const varS = (n * (n - 1) * (2 * n + 5)) / 18;
    
    // Calculate z-score with continuity correction
    let zScore: number;
    if (S > 1) {
        zScore = (S - 1) / Math.sqrt(varS);
    } else if (S < -1) {
        zScore = (S + 1) / Math.sqrt(varS);
    } else {
        // For S = -1, 0, or 1, z-score is essentially 0
        zScore = S / Math.sqrt(varS);
    }
    
    // Calculate two-tailed p-value
    const cdfValue = standardNormalCDF(Math.abs(zScore));
    const pValue = 2 * (1 - cdfValue);
    
    // Determine trend direction
    let trend: 'increasing' | 'decreasing' | 'no trend';
    if (pValue < 0.05) {
        trend = S > 0 ? 'increasing' : 'decreasing';
    } else {
        trend = 'no trend';
    }
    
    // Determine significance level
    let significance: 'strong' | 'moderate' | 'weak' | 'none';
    if (pValue < 0.01) {
        significance = 'strong';
    } else if (pValue < 0.05) {
        significance = 'moderate';
    } else if (pValue < 0.10) {
        significance = 'weak';
    } else {
        significance = 'none';
    }
    
    return { S, tau, zScore, pValue, trend, significance };
}

/**
 * Wald-Wolfowitz Runs Test
 * Tests for randomness in a sequence
 * Returns null if insufficient data (need at least 10 observations)
 */
export function runsTest(data: number[]): {
    runs: number;
    expectedRuns: number;
    zScore: number;
    pValue: number;
    pattern: 'random' | 'clustered' | 'oscillating';
    significance: 'strong' | 'moderate' | 'weak' | 'none';
} | null {
    const n = data.length;
    
    // Need at least 10 observations for meaningful results
    if (n < 10) {
        return null;
    }
    
    // Calculate median
    const median = getMedian(data);
    
    // Convert to binary sequence (above/below median)
    const binary = data.map(val => val > median ? 1 : 0);
    
    // Count number of values above and below median
    const n1 = binary.filter(v => v === 1).length;
    const n2 = binary.filter(v => v === 0).length;
    
    // Need both above and below median values
    if (n1 === 0 || n2 === 0) {
        return null;
    }
    
    // Count runs
    let runs = 1;
    for (let i = 1; i < n; i++) {
        if (binary[i] !== binary[i - 1]) {
            runs++;
        }
    }
    
    // Calculate expected runs and variance
    const expectedRuns = (2 * n1 * n2) / (n1 + n2) + 1;
    const variance = (2 * n1 * n2 * (2 * n1 * n2 - n1 - n2)) / 
                     (Math.pow(n1 + n2, 2) * (n1 + n2 - 1));
    
    // Calculate z-score with continuity correction
    let zScore: number;
    if (runs > expectedRuns) {
        zScore = (runs - 0.5 - expectedRuns) / Math.sqrt(variance);
    } else if (runs < expectedRuns) {
        zScore = (runs + 0.5 - expectedRuns) / Math.sqrt(variance);
    } else {
        zScore = 0;
    }
    
    // Calculate two-tailed p-value
    const pValue = 2 * (1 - standardNormalCDF(Math.abs(zScore)));
    
    // Determine pattern
    let pattern: 'random' | 'clustered' | 'oscillating';
    if (pValue < 0.05) {
        pattern = runs < expectedRuns ? 'clustered' : 'oscillating';
    } else {
        pattern = 'random';
    }
    
    // Determine significance level
    let significance: 'strong' | 'moderate' | 'weak' | 'none';
    if (pValue < 0.01) {
        significance = 'strong';
    } else if (pValue < 0.05) {
        significance = 'moderate';
    } else if (pValue < 0.10) {
        significance = 'weak';
    } else {
        significance = 'none';
    }
    
    return { runs, expectedRuns, zScore, pValue, pattern, significance };
}
