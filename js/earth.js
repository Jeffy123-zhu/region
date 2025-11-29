/**
 * EcoTrack - 3D Earth Visualization
 * Uses Three.js to render an interactive globe
 * 
 * This was fun to build! Took a while to get the lighting right
 * Tutorial used: https://threejs.org/docs/#manual/en/introduction/Creating-a-scene
 */

const Earth = {
    scene: null,
    camera: null,
    renderer: null,
    earth: null,
    atmosphere: null,
    particles: null,
    animationId: null,

    /**
     * Initialize the 3D earth visualization
     */
    init: function() {
        const container = document.getElementById('earth-container');
        if (!container) {
            console.log('Earth container not found');
            return;
        }

        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded, showing fallback');
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:4rem;">🌍</div>';
            return;
        }
        
        console.log('Initializing 3D Earth...');

        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera
        const aspect = container.clientWidth / container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.z = 12;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        // Create earth
        this.createEarth();
        this.createAtmosphere();
        this.createParticles();
        this.createLights();

        // Start animation
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        
        console.log('3D Earth initialized successfully');
    },

    /**
     * Create the earth sphere
     */
    createEarth: function() {
        const geometry = new THREE.SphereGeometry(5, 64, 64);
        
        // Create a nice looking earth without textures
        // (textures would require external files)
        const material = new THREE.MeshPhongMaterial({
            color: 0x1a8f5c,
            emissive: 0x072534,
            specular: 0x333333,
            shininess: 25
        });

        this.earth = new THREE.Mesh(geometry, material);
        this.scene.add(this.earth);

        // Add some "continents" using a second sphere with noise
        // this is a hack but looks decent
        const landGeometry = new THREE.SphereGeometry(5.01, 32, 32);
        const landMaterial = new THREE.MeshPhongMaterial({
            color: 0x2dd4bf,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const land = new THREE.Mesh(landGeometry, landMaterial);
        this.earth.add(land);
    },

    /**
     * Create atmosphere glow effect
     */
    createAtmosphere: function() {
        const geometry = new THREE.SphereGeometry(5.4, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });

        this.atmosphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.atmosphere);
    },

    /**
     * Create floating particles around earth
     */
    createParticles: function() {
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Random position on a sphere shell
            const radius = 7 + Math.random() * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x10b981,
            size: 0.08,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    },

    /**
     * Setup lighting
     */
    createLights: function() {
        // Ambient light for overall illumination
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // Main light source (like the sun)
        const sunLight = new THREE.PointLight(0xffffff, 1.2);
        sunLight.position.set(15, 10, 15);
        this.scene.add(sunLight);

        // Subtle fill light from opposite side
        const fillLight = new THREE.PointLight(0x3b82f6, 0.3);
        fillLight.position.set(-10, -5, -10);
        this.scene.add(fillLight);
    },

    /**
     * Animation loop
     */
    animate: function() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate earth slowly
        if (this.earth) {
            this.earth.rotation.y += 0.002;
        }

        // Rotate atmosphere slightly slower for depth effect
        if (this.atmosphere) {
            this.atmosphere.rotation.y += 0.001;
        }

        // Rotate particles in opposite direction
        if (this.particles) {
            this.particles.rotation.y -= 0.0005;
        }

        this.renderer.render(this.scene, this.camera);
    },

    /**
     * Handle window resize
     */
    onResize: function() {
        const container = document.getElementById('earth-container');
        if (!container || !this.camera || !this.renderer) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    /**
     * Cleanup when component is destroyed
     */
    destroy: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const container = document.getElementById('earth-container');
        if (container && this.renderer) {
            container.removeChild(this.renderer.domElement);
        }

        // Dispose of Three.js objects
        if (this.earth) {
            this.earth.geometry.dispose();
            this.earth.material.dispose();
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Earth;
}
