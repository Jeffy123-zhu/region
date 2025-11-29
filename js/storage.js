/**
 * EcoTrack - Storage Module
 * Handles data persistence with localStorage
 * 
 * We're using localStorage for simplicity since this is a hackathon project
 * In a real app we'd probably use a database like Firebase or MongoDB
 */

const Storage = {
    KEYS: {
        DATA: 'ecotrack_data',
        SETTINGS: 'ecotrack_settings',
        THEME: 'ecotrack_theme'
    },

    /**
     * Default data structure
     */
    defaultData: {
        daily: {},
        activities: [],
        stats: {
            totalLogged: 0,
            ecoChoices: 0,
            bikeTrips: 0,
            plantMeals: 0,
            totalCarbonSaved: 0
        },
        achievements: {
            firstStep: false,
            cyclist: false,
            plantPowered: false,
            carbonSaver: false,
            weekStreak: false
        },
        createdAt: null,
        lastUpdated: null
    },

    /**
     * Initialize storage with default data if empty
     * @returns {Object} Application data
     */
    init: function() {
        let data = this.get(this.KEYS.DATA);
        if (!data) {
            data = this.deepClone(this.defaultData);
            data.createdAt = new Date().toISOString();
            this.set(this.KEYS.DATA, data);
        }
        return data;
    },

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {Object|null} Stored data or null
     */
    get: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },

    /**
     * Set data in localStorage
     * @param {string} key - Storage key
     * @param {Object} value - Data to store
     * @returns {boolean} Success status
     */
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },

    /**
     * Clear all EcoTrack data
     */
    clearAll: function() {
        Object.values(this.KEYS).forEach(key => this.remove(key));
    },

    /**
     * Export data as JSON string
     * @returns {string} JSON data
     */
    export: function() {
        const data = this.get(this.KEYS.DATA);
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON string
     * @param {string} jsonString - JSON data to import
     * @returns {boolean} Success status
     */
    import: function(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.set(this.KEYS.DATA, data);
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    },

    /**
     * Get storage usage in bytes
     * @returns {number} Bytes used
     * 
     * not really using this right now but might be useful later
     * to warn users if they're running low on storage
     */
    getUsage: function() {
        let total = 0;
        Object.values(this.KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length * 2; // UTF-16 characters (i think?)
            }
        });
        return total;
    },

    /**
     * Deep clone helper
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
