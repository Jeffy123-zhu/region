/**
 * EcoTrack - Carbon Footprint Tracker
 * Main Application JavaScript
 * 
 * Built for Region Hacks 2025 - KWC Region
 * 
 * Simplified version with 3 core pages:
 * - Dashboard (stats + charts + earth)
 * - Log Activity
 * - KWC Resources
 */

// ============ DATA STORAGE ============
const STORAGE_KEY = 'ecotrack_data';

const defaultData = {
    daily: {},
    activities: [],
    stats: { logged: 0, ecoChoices: 0 }
};

let data = loadData();

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : { ...defaultData };
    } catch (e) {
        return { ...defaultData };
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    setupNav();
    setupLogButtons();
    updateDate();
    updateDashboard();
    initCharts();
    updateActivityList();
    updateResources();
    
    // Initialize 3D Earth after a short delay
    setTimeout(initEarth, 200);
});

// ============ NAVIGATION ============
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(this.dataset.page).classList.add('active');
        });
    });
}

function updateDate() {
    const el = document.getElementById('current-date');
    if (el) {
        el.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        });
    }
}

// ============ LOG ACTIVITY ============
function setupLogButtons() {
    document.querySelectorAll('.log-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cat = this.dataset.cat;
            const type = this.dataset.type;
            const co2 = parseFloat(this.dataset.co2);
            logActivity(cat, type, co2);
        });
    });
}

function logActivity(category, type, co2) {
    const today = getTodayKey();
    
    // Initialize today if needed
    if (!data.daily[today]) {
        data.daily[today] = { transport: 0, food: 0, energy: 0, total: 0 };
    }
    
    // Update totals
    data.daily[today][category] += co2;
    data.daily[today].total += co2;
    
    // Add to activity log
    data.activities.unshift({
        category, type, co2,
        time: new Date().toISOString()
    });
    
    // Keep only last 50 activities
    if (data.activities.length > 50) {
        data.activities = data.activities.slice(0, 50);
    }
    
    // Update stats
    data.stats.logged++;
    if (co2 <= 0) data.stats.ecoChoices++;
    
    saveData();
    updateDashboard();
    updateCharts();
    updateActivityList();
    updateResources();
    updateEarthHealth();  // Update earth color based on new data
    
    // Show feedback
    showToast(co2 <= 0 ? 'Great eco choice!' : `+${co2} kg CO2 logged`);
}

// ============ DASHBOARD ============
function updateDashboard() {
    const today = getTodayKey();
    const todayData = data.daily[today] || { transport: 0, food: 0, energy: 0, total: 0 };
    
    // Update stat values
    animateNum('today-total', todayData.total);
    animateNum('transport-total', todayData.transport);
    animateNum('food-total', todayData.food);
    animateNum('energy-total', todayData.energy);
    
    // Update comparison text
    const compEl = document.getElementById('comparison-text');
    if (compEl) {
        if (todayData.total === 0) {
            compEl.textContent = 'Start logging to track';
        } else if (todayData.total < 10) {
            compEl.textContent = 'Below average - great job!';
        } else if (todayData.total < 14.2) {
            compEl.textContent = 'Below KWC average';
        } else {
            compEl.textContent = 'Above KWC average';
        }
    }
    
    // Update impact stats
    updateImpact();
}

function animateNum(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const start = parseFloat(el.textContent) || 0;
    const duration = 300;
    const startTime = performance.now();
    
    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const current = start + (target - start) * (1 - Math.pow(1 - progress, 3));
        el.textContent = current.toFixed(1);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function updateImpact() {
    // Calculate averages
    const days = Object.keys(data.daily);
    let total = 0;
    days.forEach(d => total += data.daily[d].total || 0);
    const avg = days.length > 0 ? total / days.length : 0;
    
    // Trees needed (1 tree absorbs ~21kg CO2/year)
    const monthlyTotal = avg * 30;
    const trees = Math.ceil(monthlyTotal * 12 / 21);
    const treesEl = document.getElementById('trees-needed');
    if (treesEl) treesEl.textContent = trees;
    
    // vs Average
    const vsEl = document.getElementById('vs-average');
    if (vsEl) {
        if (avg === 0) {
            vsEl.textContent = '--';
        } else {
            const diff = ((avg - 14.2) / 14.2 * 100).toFixed(0);
            vsEl.textContent = diff < 0 ? `${Math.abs(diff)}% below` : `${diff}% above`;
        }
    }
    
    // Eco choices
    const ecoEl = document.getElementById('eco-choices');
    if (ecoEl) ecoEl.textContent = data.stats.ecoChoices;
}

// ============ CHARTS ============
let weeklyChart = null;
let categoryChart = null;

function initCharts() {
    // Weekly trend chart
    const weeklyCtx = document.getElementById('weekly-chart');
    if (weeklyCtx) {
        weeklyChart = new Chart(weeklyCtx, {
            type: 'line',
            data: {
                labels: getLast7Days(),
                datasets: [{
                    label: 'CO2 (kg)',
                    data: getLast7DaysData(),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(148,163,184,0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    // Category breakdown chart
    const catCtx = document.getElementById('category-chart');
    if (catCtx) {
        const today = data.daily[getTodayKey()] || { transport: 0, food: 0, energy: 0 };
        categoryChart = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: ['Transport', 'Food', 'Energy'],
                datasets: [{
                    data: [
                        Math.max(today.transport, 0.1),
                        Math.max(today.food, 0.1),
                        Math.max(today.energy, 0.1)
                    ],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', padding: 15 }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

function updateCharts() {
    if (weeklyChart) {
        weeklyChart.data.datasets[0].data = getLast7DaysData();
        weeklyChart.update();
    }
    
    if (categoryChart) {
        const today = data.daily[getTodayKey()] || { transport: 0, food: 0, energy: 0 };
        categoryChart.data.datasets[0].data = [
            Math.max(today.transport, 0.1),
            Math.max(today.food, 0.1),
            Math.max(today.energy, 0.1)
        ];
        categoryChart.update();
    }
}

function getLast7Days() {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return labels;
}

function getLast7DaysData() {
    const values = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        values.push(data.daily[key]?.total || 0);
    }
    return values;
}

// ============ ACTIVITY LIST ============
const typeNames = {
    car: 'Car Trip', bus: 'Bus Trip', bike: 'Bicycle', walk: 'Walking',
    beef: 'Beef Meal', chicken: 'Chicken', vegetarian: 'Vegetarian', vegan: 'Vegan',
    heating: 'Heating', ac: 'AC', laundry: 'Laundry', unplug: 'Unplugged Devices'
};

function updateActivityList() {
    const list = document.getElementById('activity-list');
    if (!list) return;
    
    if (data.activities.length === 0) {
        list.innerHTML = '<p class="empty-msg">No activities logged yet</p>';
        return;
    }
    
    list.innerHTML = data.activities.slice(0, 10).map(a => {
        const time = new Date(a.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const co2Class = a.co2 > 0 ? 'positive' : 'negative';
        const co2Text = a.co2 > 0 ? `+${a.co2.toFixed(1)}` : a.co2.toFixed(1);
        return `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-type">${typeNames[a.type] || a.type}</span>
                    <span class="activity-time">${time}</span>
                </div>
                <span class="activity-co2 ${co2Class}">${co2Text} kg</span>
            </div>
        `;
    }).join('');
}

// ============ RESOURCES PAGE ============
function updateResources() {
    const days = Object.keys(data.daily);
    let total = 0;
    days.forEach(d => total += data.daily[d].total || 0);
    const avg = days.length > 0 ? total / days.length : 0;
    
    const avgEl = document.getElementById('your-avg');
    if (avgEl) avgEl.textContent = avg.toFixed(1);
}

// ============ 3D EARTH ============
// Global reference so we can update earth color
let earthMaterial = null;
let atmosphereMaterial = null;
let particleMaterial = null;

function initEarth() {
    const container = document.getElementById('earth-container');
    if (!container) return;
    
    // Check if Three.js loaded
    if (typeof THREE === 'undefined') {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:4rem;">🌍</div>';
        return;
    }
    
    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 12;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Earth - color will change based on carbon footprint
    const earthGeo = new THREE.SphereGeometry(5, 64, 64);
    earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a8f5c,  // green = healthy
        emissive: 0x072534,
        shininess: 25
    });
    const earth = new THREE.Mesh(earthGeo, earthMaterial);
    scene.add(earth);
    
    // Wireframe overlay
    const wireGeo = new THREE.SphereGeometry(5.02, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.15,
        wireframe: true
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    earth.add(wire);
    
    // Atmosphere glow - changes with health
    const atmoGeo = new THREE.SphereGeometry(5.3, 64, 64);
    atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x10b981,  // green glow = healthy
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide
    });
    const atmo = new THREE.Mesh(atmoGeo, atmosphereMaterial);
    scene.add(atmo);
    
    // Particles - color changes with health
    const particleCount = 400;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
        const r = 7 + Math.random() * 2.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i+1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i+2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleMaterial = new THREE.PointsMaterial({ color: 0x10b981, size: 0.06, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particles);
    
    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.PointLight(0xffffff, 1.2);
    sun.position.set(15, 10, 15);
    scene.add(sun);
    
    // Animation
    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.002;
        particles.rotation.y -= 0.0005;
        renderer.render(scene, camera);
    }
    animate();
    
    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Set initial earth color based on existing data
    setTimeout(updateEarthHealth, 100);
}

// ============ UPDATE EARTH BASED ON CARBON ============
// Earth changes color based on today's carbon footprint
// Low carbon = green & glowing | High carbon = red & dim
function updateEarthHealth() {
    if (!earthMaterial || !atmosphereMaterial || !particleMaterial) return;
    
    const today = data.daily[getTodayKey()] || { total: 0 };
    const todayTotal = today.total;
    
    // Calculate health: 0 = perfect, 1 = bad
    // Under 5kg = great, 5-10 = ok, 10-15 = warning, 15+ = bad
    let health = Math.min(todayTotal / 20, 1); // 0 to 1
    
    // Interpolate colors
    // Green (healthy): 0x1a8f5c -> Red (unhealthy): 0x8f1a1a
    const greenR = 0x1a, greenG = 0x8f, greenB = 0x5c;
    const redR = 0xbf, redG = 0x2a, redB = 0x2a;
    
    const r = Math.round(greenR + (redR - greenR) * health);
    const g = Math.round(greenG + (redG - greenG) * health);
    const b = Math.round(greenB + (redB - greenB) * health);
    
    const newColor = (r << 16) | (g << 8) | b;
    
    // Update earth color
    earthMaterial.color.setHex(newColor);
    
    // Update atmosphere - green glow when healthy, red/orange when not
    if (health < 0.3) {
        atmosphereMaterial.color.setHex(0x10b981); // green glow
        atmosphereMaterial.opacity = 0.15;
    } else if (health < 0.6) {
        atmosphereMaterial.color.setHex(0xf59e0b); // yellow/orange
        atmosphereMaterial.opacity = 0.12;
    } else {
        atmosphereMaterial.color.setHex(0xef4444); // red warning
        atmosphereMaterial.opacity = 0.18;
    }
    
    // Update particles
    particleMaterial.color.setHex(health < 0.5 ? 0x10b981 : 0xf59e0b);
    
    // Update the status text below earth
    updateEarthStatus(todayTotal, health);
}

function updateEarthStatus(total, health) {
    const container = document.getElementById('earth-container');
    if (!container) return;
    
    // Remove old status if exists
    let status = container.querySelector('.earth-status');
    if (!status) {
        status = document.createElement('div');
        status.className = 'earth-status';
        container.appendChild(status);
    }
    
    let message, color;
    if (total === 0) {
        message = "Start logging to see Earth's health";
        color = '#94a3b8';
    } else if (health < 0.25) {
        message = "Earth is thriving! Great choices!";
        color = '#10b981';
    } else if (health < 0.5) {
        message = "Earth is doing okay";
        color = '#3b82f6';
    } else if (health < 0.75) {
        message = "Earth needs your help";
        color = '#f59e0b';
    } else {
        message = "High emissions - Earth is struggling";
        color = '#ef4444';
    }
    
    status.textContent = message;
    status.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.75rem;
        color: ${color};
        font-weight: 500;
    `;
}

// ============ TOAST ============
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============ DEMO DATA ============
// Press Ctrl+D to load demo data
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        loadDemoData();
    }
});

function loadDemoData() {
    const demo = {
        daily: {},
        activities: [],
        stats: { logged: 25, ecoChoices: 10 }
    };
    
    // Generate 7 days of data
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        
        const transport = Math.random() * 3 + 0.5;
        const food = Math.random() * 4 + 1;
        const energy = Math.random() * 2 + 0.3;
        
        demo.daily[key] = {
            transport: +transport.toFixed(1),
            food: +food.toFixed(1),
            energy: +energy.toFixed(1),
            total: +(transport + food + energy).toFixed(1)
        };
    }
    
    // Sample activities
    const samples = [
        { category: 'transport', type: 'bike', co2: 0 },
        { category: 'food', type: 'vegetarian', co2: 0.5 },
        { category: 'transport', type: 'bus', co2: 0.8 },
        { category: 'food', type: 'chicken', co2: 1.8 },
        { category: 'energy', type: 'laundry', co2: 0.6 }
    ];
    samples.forEach((s, i) => {
        const t = new Date();
        t.setHours(t.getHours() - i * 2);
        demo.activities.push({ ...s, time: t.toISOString() });
    });
    
    data = demo;
    saveData();
    updateDashboard();
    updateCharts();
    updateActivityList();
    updateResources();
    updateEarthHealth();  // Update earth with demo data
    showToast('Demo data loaded!');
}
