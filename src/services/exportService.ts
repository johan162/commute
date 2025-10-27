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
    
    // Create histogram data (simplified representation)
    const binSize = 5; // minutes
    const histogramData: { [key: string]: number } = {};
    
    records.forEach(record => {
        const minutes = Math.floor(record.duration / 60);
        const binStart = Math.floor(minutes / binSize) * binSize;
        const binEnd = binStart + binSize;
        const binName = `${binStart}-${binEnd}`;
        histogramData[binName] = (histogramData[binName] || 0) + 1;
    });
    
    const histogramTableData = Object.entries(histogramData)
        .sort(([a], [b]) => parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]))
        .map(([range, count]) => [range + ' min', count.toString()]);
    
    currentY = 55;
    autoTable(doc, {
        startY: currentY,
        head: [['Duration Range', 'Number of Commutes']],
        body: histogramTableData,
        theme: 'striped',
        headStyles: { fillColor: [25, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 }
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
    
    // Create time of day data
    const timeOfDayData: { [key: string]: number } = {};
    
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
    
    const timeOfDayTableData = Object.entries(timeOfDayData)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .map(([timeSlot, count]) => [timeSlot, count.toString()]);
    
    currentY = currentY + 20;
    autoTable(doc, {
        startY: currentY,
        head: [['Time Period', 'Number of Commutes']],
        body: timeOfDayTableData,
        theme: 'striped',
        headStyles: { fillColor: [25, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 }
    });
    
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
