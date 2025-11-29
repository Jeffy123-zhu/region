/**
 * EcoTrack - Charts Module
 * Handles all Chart.js visualizations
 * 
 * Using Chart.js because it's easy to use and looks nice
 * Tried D3.js first but it was too complicated for our timeline
 */

const Charts = {
    instances: {
        weekly: null,
        category: null,
        monthly: null,
        comparison: null
    },

    colors: {
        primary: '#10b981',
        secondary: '#3b82f6',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#94a3b8',
        grid: 'rgba(148, 163, 184, 0.1)'
    },

    /**
     * Default chart options
     */
    defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    },

    /**
     * Initialize all charts
     * @param {Object} data - Application data
     */
    init: function(data) {
        this.initWeeklyChart(data);
        this.initCategoryChart(data);
    },

    /**
     * Initialize weekly trend line chart
     * @param {Object} data - Application data
     */
    initWeeklyChart: function(data) {
        const ctx = document.getElementById('weekly-chart');
        if (!ctx) return;

        const labels = this.getLast7DaysLabels();
        const values = this.getLast7DaysData(data);

        this.instances.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'CO2 (kg)',
                    data: values,
                    borderColor: this.colors.primary,
                    backgroundColor: this.createGradient(ctx, this.colors.primary),
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: this.colors.grid },
                        ticks: { color: this.colors.muted }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: this.colors.muted }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    /**
     * Initialize category doughnut chart
     * @param {Object} data - Application data
     */
    initCategoryChart: function(data) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        const todayKey = new Date().toISOString().split('T')[0];
        const todayData = data.daily[todayKey] || { transport: 0, food: 0, energy: 0 };

        this.instances.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Transport', 'Food', 'Energy'],
                datasets: [{
                    data: [
                        Math.max(todayData.transport, 0.1),
                        Math.max(todayData.food, 0.1),
                        Math.max(todayData.energy, 0.1)
                    ],
                    backgroundColor: [
                        this.colors.secondary,
                        this.colors.warning,
                        this.colors.danger
                    ],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: this.colors.muted,
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },

    /**
     * Update all charts with new data
     * @param {Object} data - Application data
     */
    update: function(data) {
        this.updateWeeklyChart(data);
        this.updateCategoryChart(data);
    },

    /**
     * Update weekly chart
     * @param {Object} data - Application data
     */
    updateWeeklyChart: function(data) {
        if (!this.instances.weekly) return;
        
        // had a bug here before where chart wouldn't update
        // turns out you need to call update() after changing data
        this.instances.weekly.data.datasets[0].data = this.getLast7DaysData(data);
        this.instances.weekly.update('active');
    },

    /**
     * Update category chart
     * @param {Object} data - Application data
     */
    updateCategoryChart: function(data) {
        if (!this.instances.category) return;

        const todayKey = new Date().toISOString().split('T')[0];
        const todayData = data.daily[todayKey] || { transport: 0, food: 0, energy: 0 };

        this.instances.category.data.datasets[0].data = [
            Math.max(todayData.transport, 0.1),
            Math.max(todayData.food, 0.1),
            Math.max(todayData.energy, 0.1)
        ];
        this.instances.category.update('active');
    },

    /**
     * Get labels for last 7 days
     * @returns {string[]} Day labels
     */
    getLast7DaysLabels: function() {
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        return labels;
    },

    /**
     * Get data for last 7 days
     * @param {Object} data - Application data
     * @returns {number[]} Daily totals
     */
    getLast7DaysData: function(data) {
        const values = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            values.push(data.daily[dateKey]?.total || 0);
        }
        return values;
    },

    /**
     * Create gradient for chart backgrounds
     * @param {HTMLCanvasElement} ctx - Canvas context
     * @param {string} color - Base color
     * @returns {CanvasGradient} Gradient object
     */
    createGradient: function(ctx, color) {
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        return gradient;
    },

    /**
     * Destroy all chart instances
     */
    destroy: function() {
        Object.values(this.instances).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Charts;
}
