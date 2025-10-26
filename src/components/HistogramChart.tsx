
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

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#A0AEC0" tick={{ fontSize: 12 }} />
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
