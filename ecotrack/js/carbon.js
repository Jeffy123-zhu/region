/**
 * EcoTrack - Carbon Calculations Module
 * Contains all carbon emission factors and calculation logic
 * 
 * Data sources:
 * - Transport Canada emissions data
 * - Region of Waterloo sustainability reports
 * - Various environmental research papers
 * 
 * NOTE: these are approximate values, real emissions vary based on
 * vehicle type, driving conditions, food source, etc.
 */

const Carbon = {
    /**
     * Carbon emission factors (kg CO2)
     * Based on average values from environmental studies
     */
    factors: {
        transport: {
            car: { value: 0.23, unit: 'per km', description: 'Average passenger car' },
            bus: { value: 0.08, unit: 'per km', description: 'Public transit bus' },
            train: { value: 0.04, unit: 'per km', description: 'Electric train' },
            bike: { value: 0, unit: 'per km', description: 'Zero emissions' },
            walk: { value: 0, unit: 'per km', description: 'Zero emissions' },
            flight: { value: 0.255, unit: 'per km', description: 'Domestic flight' }
        },
        food: {
            beef: { value: 6.5, unit: 'per meal', description: 'Beef-based meal' },
            pork: { value: 2.4, unit: 'per meal', description: 'Pork-based meal' },
            chicken: { value: 1.8, unit: 'per meal', description: 'Chicken-based meal' },
            fish: { value: 1.5, unit: 'per meal', description: 'Fish-based meal' },
            vegetarian: { value: 0.5, unit: 'per meal', description: 'Vegetarian meal' },
            vegan: { value: 0.3, unit: 'per meal', description: 'Vegan meal' }
        },
        energy: {
            electricity: { value: 0.5, unit: 'per kWh', description: 'Grid electricity (Ontario)' },
            naturalGas: { value: 2.0, unit: 'per m3', description: 'Natural gas heating' },
            ac: { value: 1.5, unit: 'per hour', description: 'Air conditioning' },
            heating: { value: 2.0, unit: 'per hour', description: 'Gas heating' },
            laundry: { value: 0.6, unit: 'per load', description: 'Washer and dryer' },
            solar: { value: -0.5, unit: 'per hour', description: 'Solar panel offset' }
        }
    },

    /**
     * Regional averages for comparison
     * Source: various government reports, may not be 100% accurate
     * TODO: find more recent data for KWC specifically
     */
    averages: {
        canada: 14.2,      // kg CO2 per person per day
        ontario: 12.8,
        kwc: 14.2,         // Kitchener-Waterloo-Cambridge estimate (using canada avg for now)
        global: 13.0
    },

    /**
     * Environmental equivalents
     */
    equivalents: {
        treesPerYear: 21,      // kg CO2 absorbed by one tree per year
        carPerKm: 0.21,        // kg CO2 per km driven
        flightPerKm: 0.255,    // kg CO2 per km flown
        smartphoneCharges: 0.008  // kg CO2 per charge
    },

    /**
     * Calculate carbon for a specific activity
     * @param {string} category - Activity category
     * @param {string} type - Activity type
     * @param {number} quantity - Amount (default 1)
     * @returns {number} Carbon in kg
     */
    calculate: function(category, type, quantity = 1) {
        const factor = this.factors[category]?.[type];
        if (!factor) return 0;
        return factor.value * quantity;
    },

    /**
     * Get activity info
     * @param {string} category - Activity category
     * @param {string} type - Activity type
     * @returns {Object} Activity information
     */
    getActivityInfo: function(category, type) {
        return this.factors[category]?.[type] || null;
    },

    /**
     * Calculate trees needed to offset carbon
     * @param {number} carbonKg - Carbon in kg
     * @param {string} period - Time period (day, month, year)
     * @returns {number} Number of trees
     */
    treesToOffset: function(carbonKg, period = 'month') {
        const multipliers = { day: 365, month: 12, year: 1 };
        const annualCarbon = carbonKg * (multipliers[period] || 1);
        return Math.ceil(annualCarbon / this.equivalents.treesPerYear);
    },

    /**
     * Convert carbon to car kilometers equivalent
     * @param {number} carbonKg - Carbon in kg
     * @returns {number} Equivalent km driven
     */
    toCarKm: function(carbonKg) {
        return Math.round(carbonKg / this.equivalents.carPerKm);
    },

    /**
     * Convert carbon to flight kilometers equivalent
     * @param {number} carbonKg - Carbon in kg
     * @returns {number} Equivalent km flown
     */
    toFlightKm: function(carbonKg) {
        return Math.round(carbonKg / this.equivalents.flightPerKm);
    },

    /**
     * Compare user average to regional average
     * @param {number} userAvg - User's daily average
     * @param {string} region - Region to compare (default 'kwc')
     * @returns {Object} Comparison result
     */
    compareToRegion: function(userAvg, region = 'kwc') {
        const regionalAvg = this.averages[region] || this.averages.kwc;
        const difference = userAvg - regionalAvg;
        const percentage = (difference / regionalAvg) * 100;
        
        return {
            userAvg: userAvg,
            regionalAvg: regionalAvg,
            difference: difference,
            percentage: percentage,
            status: percentage < -10 ? 'excellent' : 
                    percentage < 0 ? 'good' : 
                    percentage < 10 ? 'average' : 'high'
        };
    },

    /**
     * Get reduction tips based on category
     * @param {string} category - Category with highest emissions
     * @returns {string[]} Array of tips
     */
    getTips: function(category) {
        const tips = {
            transport: [
                'Use GRT public transit instead of driving',
                'Try cycling on the Iron Horse Trail',
                'Carpool with colleagues or classmates',
                'Walk for trips under 2km'
            ],
            food: [
                'Try Meatless Mondays',
                'Buy local produce from Kitchener Market',
                'Reduce beef consumption',
                'Choose seasonal vegetables'
            ],
            energy: [
                'Lower thermostat by 1-2 degrees',
                'Unplug devices when not in use',
                'Use LED light bulbs',
                'Air dry clothes when possible'
            ]
        };
        return tips[category] || tips.transport;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Carbon;
}
