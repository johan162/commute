
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
