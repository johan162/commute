import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { CommuteRecord } from '../types.ts';

interface TimeBreakdownViewProps {
    records: CommuteRecord[];
    binSizeMinutes?: number;
}

interface BreakdownData {
    timeSlot: string;
    averageDuration: number;
    count: number;
}

export const TimeBreakdownView: React.FC<TimeBreakdownViewProps> = ({ records, binSizeMinutes = 60 }) => {
    const data = useMemo<BreakdownData[]>(() => {
        if (records.length === 0) return [];
        
        // Calculate number of bins based on bin size
        const totalMinutesInDay = 24 * 60;
        const numBins = Math.ceil(totalMinutesInDay / binSizeMinutes);
        
        const groupedByTimeSlot: Record<number, { totalDuration: number; count: number }> = {};

        records.forEach(record => {
            const date = new Date(record.date);
            const minuteOfDay = date.getHours() * 60 + date.getMinutes();
            const binIndex = Math.floor(minuteOfDay / binSizeMinutes);
            
            if (!groupedByTimeSlot[binIndex]) {
                groupedByTimeSlot[binIndex] = { totalDuration: 0, count: 0 };
            }
            groupedByTimeSlot[binIndex].totalDuration += record.duration;
            groupedByTimeSlot[binIndex].count++;
        });

        const result: BreakdownData[] = [];
        for (let i = 0; i < numBins; i++) {
            const group = groupedByTimeSlot[i];
            if (group) {
                const startMinute = i * binSizeMinutes;
                const startHour = Math.floor(startMinute / 60);
                const startMin = startMinute % 60;
                const endMinute = Math.min(startMinute + binSizeMinutes, totalMinutesInDay);
                const endHour = Math.floor(endMinute / 60);
                const endMin = endMinute % 60;
                
                const timeSlot = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}-${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
                
                result.push({
                    timeSlot,
                    averageDuration: (group.totalDuration / group.count) / 60, // in minutes
                    count: group.count,
                });
            }
        }
        
        return result;

    }, [records, binSizeMinutes]);

    if(data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No commute data to display.</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis 
                    dataKey="timeSlot" 
                    stroke="#A0AEC0" 
                    tick={{ fontSize: 10 }} 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                />
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
