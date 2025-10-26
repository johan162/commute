
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
