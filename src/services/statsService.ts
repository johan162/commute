
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
