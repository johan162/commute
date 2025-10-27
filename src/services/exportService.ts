import type { CommuteRecord } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getConfidenceInterval, getConfidenceIntervalRank } from './statsService';

const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const exportToCSV = (records: CommuteRecord[]): void => {
  const headers = ['ID', 'Date', 'Time', 'Duration (s)'];
  const rows = records.map(r => {
    const dateObj = new Date(r.date);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour12: false });
    return [r.id, dateStr, timeStr, r.duration.toFixed(2)];
  });

  // Fix: Corrected typo in charset from utf-t8 to utf-8
  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + '\n' 
    + rows.map(e => e.join(',')).join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'commute_records.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (
    records: CommuteRecord[], 
    stats: { min: number; max: number; mean: number; median: number; stdDev: number }
): void => {
    const doc = new jsPDF();
    
    const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Header with title and date
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("Commute Time Report", 14, 20);
    
    // Date in top right corner
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateText = `Report Date: ${reportDate}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, 210 - 14 - dateWidth, 20);
    
    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);
    
    // Statistics Summary Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Statistics Summary", 14, 35);
    
    // Calculate confidence intervals
    const durations = records.map(record => record.duration);
    const confidenceInterval = records.length >= 5 ? getConfidenceInterval(durations, 90) : null;
    const confidenceIntervalRank = records.length >= 5 ? getConfidenceIntervalRank(durations, 90) : null;
    
    const statsTableData = [
        ['Total Trips', records.length.toString()],
        ['Min Duration', formatDuration(stats.min)],
        ['Max Duration', formatDuration(stats.max)],
        ['Mean (Average)', formatDuration(stats.mean)],
        ['Median', formatDuration(stats.median)],
        ['Standard Deviation', formatDuration(stats.stdDev)],
    ];
    
    // Add confidence intervals if we have enough data
    if (confidenceInterval && confidenceIntervalRank) {
        statsTableData.push(['', '']); // Empty row for spacing
        statsTableData.push(['90% Confidence Interval (Interpolated)', '']);
        statsTableData.push(['  • Low (5th percentile)', formatDuration(confidenceInterval.low)]);
        statsTableData.push(['  • High (95th percentile)', formatDuration(confidenceInterval.high)]);
        statsTableData.push(['90% Confidence Interval (Nearest Rank)', '']);
        statsTableData.push(['  • Low (5th percentile)', formatDuration(confidenceIntervalRank.low)]);
        statsTableData.push(['  • High (95th percentile)', formatDuration(confidenceIntervalRank.high)]);
    } else {
        statsTableData.push(['', '']);
        statsTableData.push(['90% Confidence Intervals', 'Requires 5+ records']);
    }
    
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
        startY: 40,
        head: [['Metric', 'Value']],
        body: statsTableData,
        theme: 'striped',
        headStyles: { fillColor: [25, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 }
    });
    
    // Calculate total times for different periods
    const calculateTotals = () => {
        const totalTime = records.reduce((sum, r) => sum + r.duration, 0);
        
        // Get current day/week/month/year totals
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.toISOString().split('T')[0];
        
        const getMonday = (date: Date): string => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
            return d.toISOString().split('T')[0];
        };
        const currentWeekMonday = getMonday(now);
        
        const dayTotal = records
            .filter(r => new Date(r.date).toISOString().split('T')[0] === currentDay)
            .reduce((sum, r) => sum + r.duration, 0);
        
        const weekTotal = records
            .filter(r => getMonday(new Date(r.date)) === currentWeekMonday)
            .reduce((sum, r) => sum + r.duration, 0);
        
        const monthTotal = records
            .filter(r => {
                const d = new Date(r.date);
                return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            })
            .reduce((sum, r) => sum + r.duration, 0);
        
        const yearTotal = records
            .filter(r => new Date(r.date).getFullYear() === currentYear)
            .reduce((sum, r) => sum + r.duration, 0);
        
        return { dayTotal, weekTotal, monthTotal, yearTotal, totalTime };
    };
    
    const totals = calculateTotals();
    const formatTotal = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h === 0) return `${m} minutes`;
        return `${h} hours ${m} minutes`;
    };
    
    // Total Commute Time Section
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Total Commute Time", 14, currentY);
    
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
        startY: currentY + 5,
        head: [['Period', 'Total Time']],
        body: [
            ['Today', formatTotal(totals.dayTotal)],
            ['This Week', formatTotal(totals.weekTotal)],
            ['This Month', formatTotal(totals.monthTotal)],
            ['This Year', formatTotal(totals.yearTotal)],
            ['All Time', formatTotal(totals.totalTime)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [25, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 }
    });
    
    // Add second page for charts
    doc.addPage();
    
    // Page 2 Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("Commute Charts & Analysis", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const page2DateText = `Report Date: ${reportDate}`;
    const page2DateWidth = doc.getTextWidth(page2DateText);
    doc.text(page2DateText, 210 - 14 - page2DateWidth, 20);
    
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);
    
    // Histogram Data Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Commute Duration Distribution", 14, 35);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("This section shows how your commute times are distributed across different duration ranges.", 14, 45);
    
    // Create histogram data
    const binSize = 5; // minutes
    const histogramData: { [key: string]: number } = {};
    
    records.forEach(record => {
        const minutes = Math.floor(record.duration / 60);
        const binStart = Math.floor(minutes / binSize) * binSize;
        const binEnd = binStart + binSize;
        const binName = `${binStart}-${binEnd}`;
        histogramData[binName] = (histogramData[binName] || 0) + 1;
    });
    
    const sortedHistogramData = Object.entries(histogramData)
        .sort(([a], [b]) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]));
    
    // Draw histogram chart - 10% narrower and centered
    const pageWidth = 210; // A4 width in mm
    const chartWidth = 153; // 170 * 0.9 = 10% less width
    const chartX = (pageWidth - chartWidth) / 2; // Center on page
    const chartY = 55;
    const chartHeight = 80;
    const maxCount = Math.max(...sortedHistogramData.map(([, count]) => count));
    const barWidth = chartWidth / sortedHistogramData.length;
    
    // Draw chart background
    doc.setFillColor(249, 250, 251);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    
    // Draw chart border
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.5);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');
    
    // Draw grid lines
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.25);
    for (let i = 1; i <= 4; i++) {
        const gridY = chartY + (chartHeight * i) / 5;
        doc.line(chartX, gridY, chartX + chartWidth, gridY);
    }
    
    // Draw bars with gradient effect
    sortedHistogramData.forEach(([range, count], index) => {
        const barHeight = (count / maxCount) * (chartHeight - 10);
        const barX = chartX + (index * barWidth) + 2;
        const barY = chartY + chartHeight - barHeight - 5;
        
        // Bar shadow
        doc.setFillColor(200, 200, 200);
        doc.rect(barX + 1, barY + 1, barWidth - 4, barHeight, 'F');
        
        // Main bar
        doc.setFillColor(25, 51, 102);
        doc.rect(barX, barY, barWidth - 4, barHeight, 'F');
        
        // Bar border
        doc.setDrawColor(15, 35, 70);
        doc.setLineWidth(0.5);
        doc.rect(barX, barY, barWidth - 4, barHeight, 'S');
        
        // Value label on top of bar
        if (barHeight > 15) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(count.toString(), barX + (barWidth - 4) / 2, barY + barHeight / 2, { align: 'center' });
        } else if (barHeight > 5) {
            // Put label above bar if bar is too short
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(count.toString(), barX + (barWidth - 4) / 2, barY - 2, { align: 'center' });
        }
    });
    
    // Draw Y-axis scale with smart scaling to avoid duplicates
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Calculate appropriate scale intervals
    const calculateHistogramScaleValues = (maxValue: number, divisions: number = 4): number[] => {
        if (maxValue === 0) return [0, 0, 0, 0, 0];
        
        // If maxValue is small, use decimals to avoid duplicates
        if (maxValue <= divisions) {
            const step = maxValue / divisions;
            return Array.from({ length: divisions + 1 }, (_, i) => +(step * i).toFixed(1));
        }
        
        // For larger values, calculate nice round intervals
        const roughStep = maxValue / divisions;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;
        
        let niceStep: number;
        if (normalizedStep <= 1) niceStep = 1;
        else if (normalizedStep <= 2) niceStep = 2;
        else if (normalizedStep <= 5) niceStep = 5;
        else niceStep = 10;
        
        const finalStep = niceStep * magnitude;
        const scaleMax = Math.ceil(maxValue / finalStep) * finalStep;
        
        const values: number[] = [];
        for (let i = 0; i <= divisions; i++) {
            values.push((scaleMax * i) / divisions);
        }
        return values;
    };
    
    const histogramScaleValues = calculateHistogramScaleValues(maxCount);
    
    for (let i = 0; i <= 4; i++) {
        const scaleValue = histogramScaleValues[i];
        const scaleY = chartY + chartHeight - (chartHeight * i) / 4;
        const displayValue = scaleValue % 1 === 0 ? scaleValue.toString() : scaleValue.toFixed(1);
        doc.text(displayValue, chartX - 5, scaleY + 1, { align: 'right' });
    }
    
    // Draw axis labels
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    sortedHistogramData.forEach(([range], index) => {
        const labelX = chartX + (index * barWidth) + barWidth / 2;
        const labelY = chartY + chartHeight + 8;
        doc.text(range.replace('-', '–') + 'm', labelX, labelY, { align: 'center', angle: 45 });
    });
    
    // Y-axis label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Number of Commutes', chartX - 10, chartY + chartHeight / 2, { align: 'center', angle: 90 });
    
    // X-axis label
    doc.text('Duration Range (minutes)', chartX + chartWidth / 2, chartY + chartHeight + 20, { align: 'center' });
    
    // Chart title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Commute Duration Histogram', chartX + chartWidth / 2, chartY - 5, { align: 'center' });
    
    // Add summary table below chart
    const histogramTableData = sortedHistogramData.map(([range, count]) => [range + ' min', count.toString()]);
    
    currentY = chartY + chartHeight + 35;
    autoTable(doc, {
        startY: currentY,
        head: [['Duration Range', 'Number of Commutes']],
        body: histogramTableData,
        theme: 'striped',
        headStyles: { fillColor: [25, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 }
    });
    
    // Time of Day Analysis Section
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Check if we need to move to next section or new page
    if (currentY > 200) {
        doc.addPage();
        currentY = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Time of Day Breakdown", 14, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("This section shows when you typically commute throughout the day.", 14, currentY + 10);
    
    // Create time of day data with consistent ordering
    const timeSlotOrder = ['Early Morning (5-9)', 'Morning (9-12)', 'Afternoon (12-17)', 'Evening (17-21)', 'Night (21-5)'];
    const timeSlotColors = [
        [216, 191, 140], // Early Morning - soft warm beige
        [147, 171, 129], // Morning - muted sage green
        [108, 141, 162], // Afternoon - professional blue-gray
        [133, 119, 144], // Evening - subtle lavender-gray
        [89, 107, 125]   // Night - deep blue-gray
    ];
    
    const timeOfDayData: { [key: string]: number } = {};
    
    // Initialize all time slots to 0
    timeSlotOrder.forEach(slot => {
        timeOfDayData[slot] = 0;
    });
    
    records.forEach(record => {
        const hour = new Date(record.date).getHours();
        let timeSlot = '';
        if (hour >= 5 && hour < 9) timeSlot = 'Early Morning (5-9)';
        else if (hour >= 9 && hour < 12) timeSlot = 'Morning (9-12)';
        else if (hour >= 12 && hour < 17) timeSlot = 'Afternoon (12-17)';
        else if (hour >= 17 && hour < 21) timeSlot = 'Evening (17-21)';
        else timeSlot = 'Night (21-5)';
        
        timeOfDayData[timeSlot] = (timeOfDayData[timeSlot] || 0) + 1;
    });
    
    // Create ordered data for chart
    const orderedTimeData = timeSlotOrder.map(slot => [slot, timeOfDayData[slot]]);
    const maxTimeCount = Math.max(...orderedTimeData.map(([, count]) => count as number));
    
    // Draw time of day chart - 10% narrower and centered
    const timeChartWidth = 153; // 170 * 0.9 = 10% less width
    const timeChartX = (pageWidth - timeChartWidth) / 2; // Center on page
    const timeChartY = currentY + 20;
    const timeChartHeight = 70;
    const timeBarWidth = timeChartWidth / orderedTimeData.length;
    
    // Draw chart background
    doc.setFillColor(249, 250, 251);
    doc.rect(timeChartX, timeChartY, timeChartWidth, timeChartHeight, 'F');
    
    // Draw chart border
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.5);
    doc.rect(timeChartX, timeChartY, timeChartWidth, timeChartHeight, 'S');
    
    // Draw grid lines
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.25);
    for (let i = 1; i <= 4; i++) {
        const gridY = timeChartY + (timeChartHeight * i) / 5;
        doc.line(timeChartX, gridY, timeChartX + timeChartWidth, gridY);
    }
    
    // Draw bars with different colors for each time period
    orderedTimeData.forEach(([timeSlot, count], index) => {
        const barHeight = maxTimeCount > 0 ? ((count as number) / maxTimeCount) * (timeChartHeight - 10) : 0;
        const barX = timeChartX + (index * timeBarWidth) + 4;
        const barY = timeChartY + timeChartHeight - barHeight - 5;
        
        // Bar shadow
        doc.setFillColor(200, 200, 200);
        doc.rect(barX + 1, barY + 1, timeBarWidth - 8, barHeight, 'F');
        
        // Main bar with time-specific color
        const [r, g, b] = timeSlotColors[index];
        doc.setFillColor(r, g, b);
        doc.rect(barX, barY, timeBarWidth - 8, barHeight, 'F');
        
        // Bar border
        doc.setDrawColor(r * 0.7, g * 0.7, b * 0.7);
        doc.setLineWidth(0.5);
        doc.rect(barX, barY, timeBarWidth - 8, barHeight, 'S');
        
        // Value label on or above bar
        const countNum = count as number;
        if (countNum > 0) {
            if (barHeight > 15) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(countNum.toString(), barX + (timeBarWidth - 8) / 2, barY + barHeight / 2, { align: 'center' });
            } else {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(countNum.toString(), barX + (timeBarWidth - 8) / 2, barY - 2, { align: 'center' });
            }
        }
    });
    
    // Draw Y-axis scale with smart scaling to avoid duplicates
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Calculate appropriate scale intervals
    const calculateScaleValues = (maxValue: number, divisions: number = 4): number[] => {
        if (maxValue === 0) return [0, 0, 0, 0, 0];
        
        // If maxValue is small, use decimals to avoid duplicates
        if (maxValue <= divisions) {
            const step = maxValue / divisions;
            return Array.from({ length: divisions + 1 }, (_, i) => +(step * i).toFixed(1));
        }
        
        // For larger values, calculate nice round intervals
        const roughStep = maxValue / divisions;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;
        
        let niceStep: number;
        if (normalizedStep <= 1) niceStep = 1;
        else if (normalizedStep <= 2) niceStep = 2;
        else if (normalizedStep <= 5) niceStep = 5;
        else niceStep = 10;
        
        const finalStep = niceStep * magnitude;
        const scaleMax = Math.ceil(maxValue / finalStep) * finalStep;
        
        const values: number[] = [];
        for (let i = 0; i <= divisions; i++) {
            values.push((scaleMax * i) / divisions);
        }
        return values;
    };
    
    const scaleValues = calculateScaleValues(maxTimeCount);
    
    for (let i = 0; i <= 4; i++) {
        const scaleValue = scaleValues[i];
        const scaleY = timeChartY + timeChartHeight - (timeChartHeight * i) / 4;
        const displayValue = scaleValue % 1 === 0 ? scaleValue.toString() : scaleValue.toFixed(1);
        doc.text(displayValue, timeChartX - 5, scaleY + 1, { align: 'right' });
    }
    
    // Draw axis labels
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    orderedTimeData.forEach(([timeSlot], index) => {
        const labelX = timeChartX + (index * timeBarWidth) + timeBarWidth / 2;
        const labelY = timeChartY + timeChartHeight + 8;
        const shortLabel = (timeSlot as string).split(' ')[0] + '\n' + (timeSlot as string).match(/\(([^)]+)\)/)?.[1];
        doc.text(shortLabel, labelX, labelY, { align: 'center' });
    });
    
    // Y-axis label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Number of Commutes', timeChartX - 10, timeChartY + timeChartHeight / 2, { align: 'center', angle: 90 });
    
    // X-axis label
    doc.text('Time of Day', timeChartX + timeChartWidth / 2, timeChartY + timeChartHeight + 22, { align: 'center' });
    
    // Chart title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Commute Time Distribution by Period', timeChartX + timeChartWidth / 2, timeChartY - 5, { align: 'center' });
    
    // Add summary table below chart
    const timeOfDayTableData = orderedTimeData
        .filter(([, count]) => (count as number) > 0)  // Only show periods with data
        .sort(([,a], [,b]) => (b as number) - (a as number))  // Sort by count descending
        .map(([timeSlot, count]) => [timeSlot as string, (count as number).toString()]);
    
    currentY = timeChartY + timeChartHeight + 35;
    if (timeOfDayTableData.length > 0) {
        autoTable(doc, {
            startY: currentY,
            head: [['Time Period', 'Number of Commutes']],
            body: timeOfDayTableData,
            theme: 'striped',
            headStyles: { fillColor: [25, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 8 }
        });
    }
    
    // Add third page for Recent Commute Records
    doc.addPage();
    
    // Page 3 Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("Recent Commute Records", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const page3DateText = `Report Date: ${reportDate}`;
    const page3DateWidth = doc.getTextWidth(page3DateText);
    doc.text(page3DateText, 210 - 14 - page3DateWidth, 20);
    
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);
    
    // Recent Commute Records Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Latest Commute Records", 14, 35);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("This section shows your most recent commute records in chronological order.", 14, 45);
    
    // Get more recent records for dedicated page (up to 20 instead of 10)
    const recentRecords = records.slice(0, 20);
    
    currentY = 55;
    autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Time', 'Duration']],
        body: recentRecords.map(r => {
            const date = new Date(r.date);
            return [
                date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                date.toLocaleTimeString('en-GB', { hour12: false }),
                formatDuration(r.duration)
            ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [25, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 }
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`commute_report_${new Date().toISOString().split('T')[0]}.pdf`);
};
