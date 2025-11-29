/**
 * EcoTrack - UI Module
 * Handles all user interface interactions and updates
 * 
 * Separated UI logic from main app.js to keep things organized
 * Makes it easier to find and fix bugs
 */

const UI = {
    /**
     * Activity type display names
     */
    activityNames: {
        car: 'Car Trip',
        bus: 'Bus Trip',
        bike: 'Bicycle',
        walk: 'Walking',
        train: 'Train',
        beef: 'Beef Meal',
        chicken: 'Chicken Meal',
        pork: 'Pork Meal',
        fish: 'Fish Meal',
        vegetarian: 'Vegetarian Meal',
        vegan: 'Vegan Meal',
        ac: 'Air Conditioning',
        heating: 'Heating',
        laundry: 'Laundry',
        solar: 'Solar Energy'
    },

    /**
     * Initialize UI components
     */
    init: function() {
        this.setupNavigation();
        this.updateCurrentDate();
    },

    /**
     * Setup navigation between pages
     */
    setupNavigation: function() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                const pageId = item.dataset.page;
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                
                const targetPage = document.getElementById(pageId);
                if (targetPage) {
                    targetPage.classList.add('active');
                }
            });
        });
    },

    /**
     * Update current date display
     */
    updateCurrentDate: function() {
        const element = document.getElementById('current-date');
        if (element) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            element.textContent = new Date().toLocaleDateString('en-US', options);
        }
    },

    /**
     * Animate a numeric value change
     * @param {string} elementId - Target element ID
     * @param {number} targetValue - Target value
     * @param {number} duration - Animation duration in ms
     * 
     * This makes the numbers look cool when they change
     * Found this easing function on stackoverflow
     */
    animateValue: function(elementId, targetValue, duration = 400) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startValue = parseFloat(element.textContent) || 0;
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (targetValue - startValue) * eased;
            
            element.textContent = current.toFixed(1);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    },

    /**
     * Update dashboard statistics
     * @param {Object} todayData - Today's carbon data
     */
    updateDashboard: function(todayData) {
        this.animateValue('today-total', todayData.total || 0);
        this.animateValue('transport-total', todayData.transport || 0);
        this.animateValue('food-total', todayData.food || 0);
        this.animateValue('energy-total', todayData.energy || 0);
    },

    /**
     * Update daily change indicator
     * @param {number} todayTotal - Today's total
     * @param {number} yesterdayTotal - Yesterday's total
     */
    updateDailyChange: function(todayTotal, yesterdayTotal) {
        const element = document.getElementById('daily-change');
        if (!element) return;
        
        if (!yesterdayTotal) {
            element.innerHTML = '<span>No previous data</span>';
            element.className = 'stat-change';
            return;
        }
        
        const change = ((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(0);
        
        if (change < 0) {
            element.innerHTML = `<span>${change}% vs yesterday</span>`;
            element.className = 'stat-change positive';
        } else if (change > 0) {
            element.innerHTML = `<span>+${change}% vs yesterday</span>`;
            element.className = 'stat-change negative';
        } else {
            element.innerHTML = '<span>Same as yesterday</span>';
            element.className = 'stat-change';
        }
    },

    /**
     * Update impact metrics display
     * @param {Object} metrics - Impact metrics object
     */
    updateImpactMetrics: function(metrics) {
        const treesEl = document.getElementById('trees-equivalent');
        const carEl = document.getElementById('car-km');
        const compEl = document.getElementById('kwc-comparison');
        
        if (treesEl) treesEl.textContent = metrics.trees || 0;
        if (carEl) carEl.textContent = metrics.carKm || 0;
        if (compEl) compEl.textContent = metrics.comparison || '--';
    },

    /**
     * Update activity list
     * @param {Array} activities - Recent activities array
     */
    updateActivityList: function(activities) {
        const listElement = document.getElementById('activity-list');
        if (!listElement) return;
        
        if (!activities || activities.length === 0) {
            listElement.innerHTML = '<p class="empty-state">No activities logged yet. Start tracking above.</p>';
            return;
        }
        
        listElement.innerHTML = activities.slice(0, 10).map(activity => {
            const time = new Date(activity.timestamp);
            const timeStr = time.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
            const carbonClass = activity.carbon > 0 ? 'positive' : 'negative';
            const carbonStr = activity.carbon > 0 
                ? `+${activity.carbon.toFixed(1)}` 
                : activity.carbon.toFixed(1);
            
            return `
                <div class="activity-item">
                    <div class="activity-info">
                        <span class="activity-type">${this.activityNames[activity.type] || activity.type}</span>
                        <span class="activity-time">${timeStr}</span>
                    </div>
                    <span class="activity-carbon ${carbonClass}">${carbonStr} kg</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Update progress bar
     * @param {string} elementId - Progress fill element ID
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateProgress: function(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = Math.min(percentage, 100) + '%';
        }
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, info)
     */
    showToast: function(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    },

    /**
     * Toggle achievement unlocked state
     * @param {string} achievementId - Achievement element ID
     * @param {boolean} unlocked - Whether achievement is unlocked
     */
    setAchievementUnlocked: function(achievementId, unlocked) {
        const element = document.getElementById(achievementId);
        if (element) {
            if (unlocked) {
                element.classList.add('unlocked');
            } else {
                element.classList.remove('unlocked');
            }
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
