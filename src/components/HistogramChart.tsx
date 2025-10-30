
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { CommuteRecord } from '../types.ts';

interface HistogramChartProps {
    records: CommuteRecord[];
    binSizeMinutes: number;
}

interface Bin {
    name: string;
    count: number;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({ records, binSizeMinutes }) => {
    const data = useMemo<Bin[]>(() => {
        if (records.length === 0) return [];
        
        const binSizeSeconds = binSizeMinutes * 60;
        const durationsInMinutes = records.map(r => r.duration / 60);

        const maxDuration = Math.max(...durationsInMinutes);
        const bins: Record<string, number> = {};

        for(const duration of durationsInMinutes) {
            const binStart = Math.floor(duration / binSizeMinutes) * binSizeMinutes;
            const binEnd = binStart + binSizeMinutes;
            const binName = `${binStart}-${binEnd}`;
            bins[binName] = (bins[binName] || 0) + 1;
        }

        const sortedBinNames = Object.keys(bins).sort((a,b) => {
            return parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]);
        });
        
        // Ensure all bins up to the max are present
        const maxBinStart = Math.floor(maxDuration / binSizeMinutes) * binSizeMinutes;
        const result: Bin[] = [];
        for (let i = 0; i <= maxBinStart; i += binSizeMinutes) {
            const binEnd = i + binSizeMinutes;
            const binName = `${i}-${binEnd}`;
            result.push({
                name: binName,
                count: bins[binName] || 0
            });
        }
        
        return result;

    }, [records, binSizeMinutes]);

    // Calculate Y-axis ticks with preference for even numbers and multiples of 5
    const yAxisTicks = useMemo(() => {
        if (data.length === 0) return undefined;
        
        const maxCount = Math.max(...data.map(d => d.count));
        if (maxCount === 0) return [0];
        
        // Priority 1: Try even numbers (2, 4, 6, etc.)
        for (const step of [2, 4, 6, 8, 10, 20, 40, 60, 80, 100]) {
            const numTicks = Math.ceil(maxCount / step);
            if (numTicks >= 3 && numTicks <= 6) {
                const ticks: number[] = [];
                for (let i = 0; i <= numTicks; i++) {
                    ticks.push(i * step);
                }
                return ticks;
            }
        }
        
        // Priority 2: Try multiples of 5 (5, 10, 15, etc.)
        for (const step of [5, 10, 15, 25, 50]) {
            const numTicks = Math.ceil(maxCount / step);
            if (numTicks >= 3 && numTicks <= 6) {
                const ticks: number[] = [];
                for (let i = 0; i <= numTicks; i++) {
                    ticks.push(i * step);
                }
                return ticks;
            }
        }
        
        // Fallback: Use automatic Recharts behavior
        return undefined;
    }, [data]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis 
                    dataKey="name" 
                    stroke="#A0AEC0" 
                    tick={{ fontSize: 12 }} 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                />
                <YAxis 
                    allowDecimals={false} 
                    stroke="#A0AEC0" 
                    tick={{ fontSize: 12 }}
                    ticks={yAxisTicks}
                    domain={yAxisTicks ? [0, yAxisTicks[yAxisTicks.length - 1]] : [0, 'auto']}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} 
                    labelStyle={{ color: '#E2E8F0' }}
                    itemStyle={{ color: '#63B3ED' }}
                    formatter={(value: number) => [`${value} trips`, 'Count']}
                    labelFormatter={(label) => `Time: ${label} min`}
                />
                <Bar dataKey="count" name="Trips">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#2DD4BF" />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
