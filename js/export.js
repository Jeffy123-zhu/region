/**
 * EcoTrack - Data Export Module
 * Handles data export and sharing functionality
 */

const Export = {
    /**
     * Export data as JSON file
     * @param {Object} data - Application data
     */
    toJSON: function(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        this.downloadFile(blob, 'ecotrack-data.json');
    },

    /**
     * Export data as CSV file
     * @param {Object} data - Application data
     */
    toCSV: function(data) {
        const rows = [
            ['Date', 'Transport (kg)', 'Food (kg)', 'Energy (kg)', 'Total (kg)']
        ];
        
        Object.keys(data.daily).sort().forEach(date => {
            const day = data.daily[date];
            rows.push([
                date,
                day.transport.toFixed(2),
                day.food.toFixed(2),
                day.energy.toFixed(2),
                day.total.toFixed(2)
            ]);
        });
        
        const csv = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadFile(blob, 'ecotrack-data.csv');
    },

    /**
     * Generate shareable summary text
     * @param {Object} data - Application data
     * @returns {string} Summary text
     */
    generateSummary: function(data) {
        const days = Object.keys(data.daily).length;
        const totalCarbon = Object.values(data.daily)
            .reduce((sum, day) => sum + (day.total || 0), 0);
        const avgDaily = days > 0 ? totalCarbon / days : 0;
        const stats = data.stats;
        
        return `My EcoTrack Summary:
- ${days} days tracked
- ${avgDaily.toFixed(1)} kg CO2 daily average
- ${stats.ecoChoices} eco-friendly choices made
- ${stats.bikeTrips} bike/walk trips
- ${stats.plantMeals} plant-based meals

Track your carbon footprint at EcoTrack!
#RegionHacks2025 #KWC #ClimateAction`;
    },

    /**
     * Copy summary to clipboard
     * @param {Object} data - Application data
     */
    copyToClipboard: function(data) {
        const summary = this.generateSummary(data);
        navigator.clipboard.writeText(summary).then(() => {
            UI.showToast('Summary copied to clipboard');
        }).catch(err => {
            console.error('Copy failed:', err);
            UI.showToast('Failed to copy', 'error');
        });
    },

    /**
     * Download file helper
     * @param {Blob} blob - File blob
     * @param {string} filename - File name
     */
    downloadFile: function(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Generate report HTML
     * @param {Object} data - Application data
     * @returns {string} HTML report
     */
    generateReport: function(data) {
        const days = Object.keys(data.daily).length;
        const totalCarbon = Object.values(data.daily)
            .reduce((sum, day) => sum + (day.total || 0), 0);
        const avgDaily = days > 0 ? totalCarbon / days : 0;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>EcoTrack Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #10b981; }
        .stat { background: #f0fdf4; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .stat-value { font-size: 2em; font-weight: bold; color: #10b981; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8fafc; }
    </style>
</head>
<body>
    <h1>EcoTrack Carbon Report</h1>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
    
    <div class="stat">
        <div>Days Tracked</div>
        <div class="stat-value">${days}</div>
    </div>
    
    <div class="stat">
        <div>Daily Average</div>
        <div class="stat-value">${avgDaily.toFixed(1)} kg CO2</div>
    </div>
    
    <div class="stat">
        <div>Total Carbon</div>
        <div class="stat-value">${totalCarbon.toFixed(1)} kg CO2</div>
    </div>
    
    <h2>Daily Breakdown</h2>
    <table>
        <tr>
            <th>Date</th>
            <th>Transport</th>
            <th>Food</th>
            <th>Energy</th>
            <th>Total</th>
        </tr>
        ${Object.keys(data.daily).sort().reverse().map(date => {
            const day = data.daily[date];
            return `<tr>
                <td>${date}</td>
                <td>${day.transport.toFixed(1)} kg</td>
                <td>${day.food.toFixed(1)} kg</td>
                <td>${day.energy.toFixed(1)} kg</td>
                <td>${day.total.toFixed(1)} kg</td>
            </tr>`;
        }).join('')}
    </table>
    
    <p style="margin-top: 30px; color: #666;">
        Built for Region Hacks 2025 - Kitchener-Waterloo-Cambridge
    </p>
</body>
</html>`;
    },

    /**
     * Export as HTML report
     * @param {Object} data - Application data
     */
    toHTML: function(data) {
        const html = this.generateReport(data);
        const blob = new Blob([html], { type: 'text/html' });
        this.downloadFile(blob, 'ecotrack-report.html');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Export;
}
