/**
 * EcoTrack - Utility Functions
 * Helper functions for data manipulation and formatting
 */

const Utils = {
    /**
     * Format a number with specified decimal places
     * @param {number} value - Number to format
     * @param {number} decimals - Decimal places
     * @returns {string} Formatted number
     */
    formatNumber: function(value, decimals = 1) {
        return parseFloat(value).toFixed(decimals);
    },

    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type (short, long, time)
     * @returns {string} Formatted date string
     */
    formatDate: function(date, format = 'short') {
        const d = new Date(date);
        const options = {
            short: { month: 'short', day: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: 'numeric', minute: '2-digit' }
        };
        return d.toLocaleDateString('en-US', options[format] || options.short);
    },

    /**
     * Get date string in ISO format (YYYY-MM-DD)
     * @param {Date} date - Date object
     * @returns {string} ISO date string
     */
    getDateKey: function(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Calculate percentage change between two values
     * @param {number} current - Current value
     * @param {number} previous - Previous value
     * @returns {number} Percentage change
     */
    calculateChange: function(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    },

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if running on mobile device
     * @returns {boolean} True if mobile
     */
    isMobile: function() {
        return window.innerWidth <= 768;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
