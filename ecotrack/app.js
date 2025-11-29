/**
 * EcoTrack - Personal Carbon Footprint Tracker
 * Main application JavaScript
 * 
 * @author Team EcoTrack
 * @version 1.0.0
 * @description Built for Region Hacks 2025 - KWC Region
 * 
 * TODO: Add user authentication in future version
 * TODO: Connect to real carbon API for more accurate data
 */

// Application state stored in localStorage
// NOTE: we tried using IndexedDB first but localStorage was simpler for the hackathon
const STORAGE_KEY = 'ecotrack_data';

// Default data structure
const defaultData = {
    daily: {},
    activities: [],
    stats: {
        totalLogged: 0,
        ecoChoices: 0,
        bikeTrips: 0,
        plantMeals: 0
    }
};

// Load data from localStorage or use defaults
let appData = loadData();

/**
 * Load application data from localStorage
 * @returns {Object} Application data
 */
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return { ...defaultData };
}

/**
 * Save application data to localStorage
 */
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string} Today's date
 */
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Initialize the application
 * This runs when the page loads
 */
function init() {
    // console.log('EcoTrack initializing...');
    
    setupNavigation();
    setupLogButtons();
    updateCurrentDate();
    updateDashboard();
    initCharts();
    updateInsights();
    updateLocalStats();
    updateGoals();
    
    // debug: uncomment to see app data in console
    // console.log('App data:', appData);
}

/**
 * Setup navigation between pages
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding page
            const pageId = this.dataset.page;
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
        });
    });
}

/**
 * Setup log activity buttons
 */
function setupLogButtons() {
    const buttons = document.querySelectorAll('.log-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            const type = this.dataset.type;
            const carbon = parseFloat(this.dataset.carbon);
            
            logActivity(category, type, carbon);
        });
    });
}

/**
 * Update the current date display
 */
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

/**
 * Log a new activity
 * @param {string} category - Activity category (transport, food, energy)
 * @param {string} type - Specific activity type
 * @param {number} carbon - Carbon value in kg
 * 
 * NOTE: carbon values are hardcoded for now, ideally would fetch from API
 */
function logActivity(category, type, carbon) {
    const today = getTodayKey();
    
    // sanity check - shouldn't happen but just in case
    if (!category || !type) {
        console.error('Missing category or type');
        return;
    }
    
    // Initialize today's data if needed
    if (!appData.daily[today]) {
        appData.daily[today] = {
            transport: 0,
            food: 0,
            energy: 0,
            total: 0
        };
    }
    
    // Update daily totals
    appData.daily[today][category] += carbon;
    appData.daily[today].total += carbon;
    
    // Add to activity log
    const activity = {
        id: Date.now(),
        date: today,
        category: category,
        type: type,
        carbon: carbon,
        timestamp: new Date().toISOString()
    };
    appData.activities.unshift(activity);
    
    // Keep only last 100 activities
    if (appData.activities.length > 100) {
        appData.activities = appData.activities.slice(0, 100);
    }
    
    // Update stats
    appData.stats.totalLogged++;
    if (carbon <= 0) {
        appData.stats.ecoChoices++;
    }
    // count bike and walk as eco transport
    if (type === 'bike' || type === 'walk') {
        appData.stats.bikeTrips++;
    }
    // bus is also eco-friendly but we're not counting it here... maybe should?
    if (type === 'vegan' || type === 'vegetarian') {
        appData.stats.plantMeals++;
    }
    
    // Save and update UI
    saveData();
    updateDashboard();
    updateCharts();
    updateActivityList();
    updateInsights();
    updateLocalStats();
    updateGoals();
    
    // Show feedback
    const message = carbon <= 0 
        ? 'Great eco-friendly choice!' 
        : `Added ${carbon} kg CO2`;
    showToast(message);
}

/**
 * Update dashboard statistics
 */
function updateDashboard() {
    const today = getTodayKey();
    const todayData = appData.daily[today] || { transport: 0, food: 0, energy: 0, total: 0 };
    
    // Update stat values with animation
    animateValue('today-total', todayData.total);
    animateValue('transport-total', todayData.transport);
    animateValue('food-total', todayData.food);
    animateValue('energy-total', todayData.energy);
    
    // Calculate daily change
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const yesterdayData = appData.daily[yesterdayKey];
    
    const changeElement = document.getElementById('daily-change');
    if (changeElement && yesterdayData) {
        const change = ((todayData.total - yesterdayData.total) / yesterdayData.total * 100).toFixed(0);
        if (change < 0) {
            changeElement.innerHTML = `<span>${change}% vs yesterday</span>`;
            changeElement.className = 'stat-change positive';
        } else if (change > 0) {
            changeElement.innerHTML = `<span>+${change}% vs yesterday</span>`;
            changeElement.className = 'stat-change negative';
        } else {
            changeElement.innerHTML = `<span>Same as yesterday</span>`;
            changeElement.className = 'stat-change';
        }
    }
    
    // Update impact metrics
    updateImpactMetrics();
}

/**
 * Animate a numeric value change
 * @param {string} elementId - Target element ID
 * @param {number} targetValue - Target value to animate to
 */
function animateValue(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseFloat(element.textContent) || 0;
    const duration = 400;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (targetValue - startValue) * eased;
        
        element.textContent = current.toFixed(1);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Update environmental impact metrics
 */
function updateImpactMetrics() {
    // Calculate monthly total
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let monthlyTotal = 0;
    
    Object.keys(appData.daily).forEach(dateKey => {
        const date = new Date(dateKey);
        if (date >= monthStart) {
            monthlyTotal += appData.daily[dateKey].total || 0;
        }
    });
    
    // Trees needed (1 tree absorbs ~21kg CO2 per year)
    const treesNeeded = Math.ceil(monthlyTotal * 12 / 21);
    const treesElement = document.getElementById('trees-equivalent');
    if (treesElement) {
        treesElement.textContent = treesNeeded;
    }
    
    // Equivalent car km (average car emits ~0.21 kg CO2 per km)
    const carKm = Math.round(monthlyTotal / 0.21);
    const carElement = document.getElementById('car-km');
    if (carElement) {
        carElement.textContent = carKm;
    }
    
    // KWC comparison (regional average is ~14.2 kg/day)
    const days = Object.keys(appData.daily).length || 1;
    const totalCarbon = Object.values(appData.daily).reduce((sum, day) => sum + (day.total || 0), 0);
    const userAvg = totalCarbon / days;
    const comparison = ((userAvg - 14.2) / 14.2 * 100).toFixed(0);
    
    const compElement = document.getElementById('kwc-comparison');
    if (compElement) {
        if (userAvg === 0) {
            compElement.textContent = '--';
        } else if (comparison < 0) {
            compElement.textContent = `${Math.abs(comparison)}% below`;
        } else {
            compElement.textContent = `${comparison}% above`;
        }
    }
}

// Chart instances
let weeklyChart = null;
let categoryChart = null;

/**
 * Initialize charts
 */
function initCharts() {
    initWeeklyChart();
    initCategoryChart();
}

/**
 * Initialize weekly trend chart
 */
function initWeeklyChart() {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx) return;
    
    const labels = getLast7DaysLabels();
    const data = getLast7DaysData();
    
    weeklyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'CO2 (kg)',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

/**
 * Initialize category breakdown chart
 */
function initCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;
    
    const today = getTodayKey();
    const todayData = appData.daily[today] || { transport: 0, food: 0, energy: 0 };
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transport', 'Food', 'Energy'],
            datasets: [{
                data: [
                    Math.max(todayData.transport, 0.1),
                    Math.max(todayData.food, 0.1),
                    Math.max(todayData.energy, 0.1)
                ],
                backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            cutout: '65%'
        }
    });
}

/**
 * Update charts with new data
 */
function updateCharts() {
    if (weeklyChart) {
        weeklyChart.data.datasets[0].data = getLast7DaysData();
        weeklyChart.update('active');
    }
    
    if (categoryChart) {
        const today = getTodayKey();
        const todayData = appData.daily[today] || { transport: 0, food: 0, energy: 0 };
        categoryChart.data.datasets[0].data = [
            Math.max(todayData.transport, 0.1),
            Math.max(todayData.food, 0.1),
            Math.max(todayData.energy, 0.1)
        ];
        categoryChart.update('active');
    }
}

/**
 * Get labels for last 7 days
 * @returns {string[]} Array of day labels
 */
function getLast7DaysLabels() {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return labels;
}

/**
 * Get data for last 7 days
 * @returns {number[]} Array of daily totals
 */
function getLast7DaysData() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        data.push(appData.daily[dateKey]?.total || 0);
    }
    return data;
}

/**
 * Update the recent activity list
 */
function updateActivityList() {
    const listElement = document.getElementById('activity-list');
    if (!listElement) return;
    
    const recentActivities = appData.activities.slice(0, 10);
    
    if (recentActivities.length === 0) {
        listElement.innerHTML = '<p class="empty-state">No activities logged yet. Start tracking above.</p>';
        return;
    }
    
    const activityNames = {
        car: 'Car Trip',
        bus: 'Bus Trip',
        bike: 'Bicycle',
        walk: 'Walking',
        beef: 'Beef Meal',
        chicken: 'Chicken Meal',
        vegetarian: 'Vegetarian Meal',
        vegan: 'Vegan Meal',
        ac: 'Air Conditioning',
        heating: 'Heating',
        laundry: 'Laundry',
        solar: 'Solar Energy'
    };
    
    listElement.innerHTML = recentActivities.map(activity => {
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
                    <span class="activity-type">${activityNames[activity.type] || activity.type}</span>
                    <span class="activity-time">${timeStr}</span>
                </div>
                <span class="activity-carbon ${carbonClass}">${carbonStr} kg</span>
            </div>
        `;
    }).join('');
}

/**
 * Update insights based on user data
 */
function updateInsights() {
    const today = getTodayKey();
    const todayData = appData.daily[today] || { transport: 0, food: 0, energy: 0, total: 0 };
    const stats = appData.stats;
    
    // Transport insight
    const transportInsight = document.getElementById('transport-insight');
    const transportBadge = document.getElementById('transport-badge');
    if (transportInsight && transportBadge) {
        if (stats.bikeTrips >= 5) {
            transportInsight.textContent = 'Excellent! You are making great use of eco-friendly transportation. Keep cycling and walking to maintain your low carbon footprint.';
            transportBadge.textContent = 'Great';
            transportBadge.style.background = 'rgba(16, 185, 129, 0.2)';
            transportBadge.style.color = '#10b981';
        } else if (todayData.transport > 3) {
            transportInsight.textContent = 'Your transportation emissions are above average today. Consider using GRT transit or cycling for your next trip to reduce your footprint.';
            transportBadge.textContent = 'High';
            transportBadge.style.background = 'rgba(239, 68, 68, 0.2)';
            transportBadge.style.color = '#ef4444';
        } else {
            transportInsight.textContent = 'Your transportation choices are reasonable. Try the Iron Horse Trail for a zero-emission commute between Kitchener and Waterloo.';
            transportBadge.textContent = 'OK';
        }
    }
    
    // Food insight
    const foodInsight = document.getElementById('food-insight');
    const foodBadge = document.getElementById('food-badge');
    if (foodInsight && foodBadge) {
        if (stats.plantMeals >= 7) {
            foodInsight.textContent = 'Your plant-based choices are making a significant impact. A vegetarian diet can reduce food-related emissions by up to 50%.';
            foodBadge.textContent = 'Great';
            foodBadge.style.background = 'rgba(16, 185, 129, 0.2)';
            foodBadge.style.color = '#10b981';
        } else if (todayData.food > 5) {
            foodInsight.textContent = 'High-impact food choices detected. Beef has the highest carbon footprint of common foods. Try replacing one beef meal with chicken or vegetables.';
            foodBadge.textContent = 'High';
            foodBadge.style.background = 'rgba(239, 68, 68, 0.2)';
            foodBadge.style.color = '#ef4444';
        } else {
            foodInsight.textContent = 'Your diet has moderate impact. Visit the Kitchener Market for local produce with lower transportation emissions.';
            foodBadge.textContent = 'OK';
        }
    }
    
    // Energy insight
    const energyInsight = document.getElementById('energy-insight');
    const energyBadge = document.getElementById('energy-badge');
    if (energyInsight && energyBadge) {
        if (todayData.energy < 1) {
            energyInsight.textContent = 'Your energy usage is efficient. Continue monitoring your consumption to maintain these good habits.';
            energyBadge.textContent = 'Low';
            energyBadge.style.background = 'rgba(16, 185, 129, 0.2)';
            energyBadge.style.color = '#10b981';
        } else if (todayData.energy > 3) {
            energyInsight.textContent = 'High energy consumption today. Consider lowering your thermostat by 1 degree or reducing AC usage to save energy.';
            energyBadge.textContent = 'High';
            energyBadge.style.background = 'rgba(239, 68, 68, 0.2)';
            energyBadge.style.color = '#ef4444';
        } else {
            energyInsight.textContent = 'Your energy usage is average. Small changes like unplugging devices when not in use can reduce standby power consumption.';
            energyBadge.textContent = 'OK';
        }
    }
    
    // Top recommendation
    const topRec = document.getElementById('top-recommendation');
    if (topRec) {
        if (stats.totalLogged === 0) {
            topRec.textContent = 'Start logging your daily activities to receive personalized recommendations for reducing your carbon footprint.';
        } else if (todayData.transport > todayData.food && todayData.transport > todayData.energy) {
            topRec.textContent = 'Transportation is your biggest impact area today. The GRT bus system can reduce your commute emissions by up to 65% compared to driving alone.';
        } else if (todayData.food > todayData.energy) {
            topRec.textContent = 'Food choices are your main impact today. Reducing beef consumption by one meal per week can save over 300 kg CO2 annually.';
        } else {
            topRec.textContent = 'Great job tracking your footprint! Focus on maintaining your eco-friendly habits and try to stay under 10 kg CO2 per day.';
        }
    }
}

/**
 * Update KWC local statistics
 */
function updateLocalStats() {
    const days = Object.keys(appData.daily).length || 1;
    const totalCarbon = Object.values(appData.daily).reduce((sum, day) => sum + (day.total || 0), 0);
    const userAvg = totalCarbon / days;
    
    const avgElement = document.getElementById('user-daily-avg');
    if (avgElement) {
        avgElement.textContent = userAvg.toFixed(1);
    }
}

/**
 * Update goals and challenges progress
 */
function updateGoals() {
    const stats = appData.stats;
    
    // Transport challenge (5 eco trips)
    const transportProgress = Math.min(stats.bikeTrips / 5 * 100, 100);
    const transportFill = document.getElementById('transport-progress');
    const transportText = document.getElementById('transport-progress-text');
    if (transportFill) transportFill.style.width = transportProgress + '%';
    if (transportText) transportText.textContent = `${Math.min(stats.bikeTrips, 5)}/5 trips`;
    
    // Food challenge (7 plant meals)
    const foodProgress = Math.min(stats.plantMeals / 7 * 100, 100);
    const foodFill = document.getElementById('food-progress');
    const foodText = document.getElementById('food-progress-text');
    if (foodFill) foodFill.style.width = foodProgress + '%';
    if (foodText) foodText.textContent = `${Math.min(stats.plantMeals, 7)}/7 meals`;
    
    // Overall challenge (under 10kg avg)
    const days = Object.keys(appData.daily).length || 1;
    const totalCarbon = Object.values(appData.daily).reduce((sum, day) => sum + (day.total || 0), 0);
    const avgCarbon = totalCarbon / days;
    const overallProgress = avgCarbon > 0 ? Math.min((10 / avgCarbon) * 100, 100) : 0;
    const overallFill = document.getElementById('overall-progress');
    const overallText = document.getElementById('overall-progress-text');
    if (overallFill) overallFill.style.width = overallProgress + '%';
    if (overallText) overallText.textContent = avgCarbon > 0 ? `${avgCarbon.toFixed(1)} kg avg` : '-- kg avg';
    
    // Update user score
    let score = stats.totalLogged * 10;
    score += stats.ecoChoices * 25;
    score += stats.bikeTrips * 15;
    score += stats.plantMeals * 20;
    
    const scoreElement = document.getElementById('user-score');
    const rankElement = document.getElementById('user-rank');
    if (scoreElement) scoreElement.textContent = score.toLocaleString() + ' pts';
    if (rankElement) {
        if (score > 2450) rankElement.textContent = '1';
        else if (score > 2180) rankElement.textContent = '2';
        else if (score > 1920) rankElement.textContent = '3';
        else if (score > 0) rankElement.textContent = '4';
        else rankElement.textContent = '--';
    }
    
    // Update achievements
    updateAchievements();
}

/**
 * Update achievement status
 */
function updateAchievements() {
    const stats = appData.stats;
    
    // First step achievement
    if (stats.totalLogged > 0) {
        document.getElementById('ach-first')?.classList.add('unlocked');
    }
    
    // Cyclist achievement (10 bike trips)
    if (stats.bikeTrips >= 10) {
        document.getElementById('ach-cyclist')?.classList.add('unlocked');
    }
    
    // Plant powered achievement (15 plant meals)
    if (stats.plantMeals >= 15) {
        document.getElementById('ach-plant')?.classList.add('unlocked');
    }
    
    // Carbon saver achievement (50 eco choices)
    if (stats.ecoChoices >= 50) {
        document.getElementById('ach-saver')?.classList.add('unlocked');
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

/**
 * Load demo data for presentation
 */
function loadDemoData() {
    const demoData = {
        daily: {},
        activities: [],
        stats: {
            totalLogged: 28,
            ecoChoices: 12,
            bikeTrips: 6,
            plantMeals: 8
        }
    };
    
    // Generate 7 days of realistic data
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        // Randomize daily values with realistic ranges
        const transport = Math.random() * 3 + 0.5;
        const food = Math.random() * 4 + 1;
        const energy = Math.random() * 2 + 0.3;
        
        demoData.daily[dateKey] = {
            transport: parseFloat(transport.toFixed(1)),
            food: parseFloat(food.toFixed(1)),
            energy: parseFloat(energy.toFixed(1)),
            total: parseFloat((transport + food + energy).toFixed(1))
        };
    }
    
    // Add sample activities
    const sampleActivities = [
        { category: 'transport', type: 'bike', carbon: 0 },
        { category: 'food', type: 'vegetarian', carbon: 0.5 },
        { category: 'transport', type: 'bus', carbon: 0.8 },
        { category: 'food', type: 'chicken', carbon: 1.8 },
        { category: 'energy', type: 'laundry', carbon: 0.6 }
    ];
    
    sampleActivities.forEach((activity, index) => {
        const time = new Date();
        time.setHours(time.getHours() - index * 2);
        demoData.activities.push({
            id: Date.now() - index,
            date: getTodayKey(),
            ...activity,
            timestamp: time.toISOString()
        });
    });
    
    appData = demoData;
    saveData();
    
    // Refresh all UI components
    updateDashboard();
    updateCharts();
    updateActivityList();
    updateInsights();
    updateLocalStats();
    updateGoals();
    
    showToast('Demo data loaded successfully');
}

// Keyboard shortcut for demo data (Ctrl+D)
// useful for testing and presentations
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        loadDemoData();
    }
});

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// just for debugging - remove before final submission
// window.appData = appData;
// window.loadDemoData = loadDemoData;
