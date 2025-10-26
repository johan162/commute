
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { CommuteRecord } from '../types.ts';

interface TimeBreakdownViewProps {
    records: CommuteRecord[];
}

interface BreakdownData {
    hour: string;
    averageDuration: number;
    count: number;
}

export const TimeBreakdownView: React.FC<TimeBreakdownViewProps> = ({ records }) => {
    const data = useMemo<BreakdownData[]>(() => {
        if (records.length === 0) return [];
        
        const groupedByHour: Record<number, { totalDuration: number; count: number }> = {};

        records.forEach(record => {
            const hour = new Date(record.date).getHours();
            if (!groupedByHour[hour]) {
                groupedByHour[hour] = { totalDuration: 0, count: 0 };
            }
            groupedByHour[hour].totalDuration += record.duration;
            groupedByHour[hour].count++;
        });

        const result: BreakdownData[] = [];
        for (let i = 0; i < 24; i++) {
            const group = groupedByHour[i];
            if (group) {
                result.push({
                    hour: `${String(i).padStart(2, '0')}:00`,
                    averageDuration: (group.totalDuration / group.count) / 60, // in minutes
                    count: group.count,
                });
            }
        }
        
        return result;

    }, [records]);

    if(data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No commute data to display.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="hour" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                <YAxis
                    dataKey="averageDuration"
                    unit="m"
                    stroke="#A0AEC0"
                    tick={{ fontSize: 12 }}
                    width={40}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} 
                    labelStyle={{ color: '#E2E8F0' }}
                    itemStyle={{ color: '#81E6D9' }}
                    formatter={(value: number, name: string, props) => {
                        if (name === 'averageDuration') {
                            return [`${(value as number).toFixed(1)} min (average of ${props.payload.count} trips)`, 'Duration'];
                        }
                        return [value, name];
                    }}
                    labelFormatter={(label) => `Time: ${label}`}
                />
                <Bar dataKey="averageDuration" name="averageDuration">
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#81E6D9" />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
