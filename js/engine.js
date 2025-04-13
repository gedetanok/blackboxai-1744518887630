// Main game engine and loop

class Engine {
    constructor() {
        // Game canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.running = false;
        this.lastTime = 0;
        
        // Initialize game
        this.init();
    }

    // Initialize game systems
    init() {
        // Initialize systems
        camera.init(this.canvas.width, this.canvas.height);
        track.generate(0);
        opponents.init(5); // Start with 5 opponents
        player.reset();
        
        // Bind events
        window.addEventListener('resize', () => this.resize());
        
        // Initialize UI
        ui.init();
        
        // Start game loop
        this.running = true;
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    // Handle window resize
    resize() {
        // Set canvas size
        this.canvas.width = 900;  // Fixed width for better performance
        this.canvas.height = 600; // Fixed height for better performance
        
        // Center canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '50%';
        this.canvas.style.top = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
        this.canvas.style.backgroundColor = '#000';
        
        // Update camera
        if (camera) {
            camera.init(this.canvas.width, this.canvas.height);
        }
    }

    // Main game loop
    loop(timestamp) {
        // Calculate delta time
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Update game state
        this.update(dt);
        
        // Render frame
        this.render();
        
        // Continue loop
        if (this.running) {
            requestAnimationFrame((timestamp) => this.loop(timestamp));
        }
    }

    // Update game state
    update(dt) {
        // Skip updates if paused
        if (ui.state === 'pause') return;
        
        // Update game objects
        if (ui.state === 'race') {
            // Update player
            player.update(dt);
            
            // Update opponents
            opponents.update(dt);
            
            // Update camera
            const playerSegment = road.findSegment(player.z);
            camera.follow(player.x, player.y, player.z, playerSegment);
            
            // Check race completion
            if (player.isRaceComplete()) {
                ui.setState('complete');
            }
        }
        
        // Update UI
        ui.update(dt);
    }

    // Render frame
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        if (ui.state === 'race' || ui.state === 'pause') {
            // Draw background
            this.renderBackground();
            
            // Draw road
            this.renderRoad();
            
            // Draw HUD
            ui.renderHUD(this.ctx);
            
            if (ui.state === 'pause') {
                ui.renderPause(this.ctx);
            }
        } else {
            // Draw title or complete screen
            ui.render(this.ctx);
        }
    }

    // Render background
    renderBackground() {
        const currentTrack = track.getCurrentTrack();
        
        // Fill background
        this.ctx.fillStyle = currentTrack.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw mountains or city skyline based on track type
        if (currentTrack.name.includes('City')) {
            this.renderCitySkyline();
        } else {
            this.renderMountains();
        }
    }

    // Render mountains background
    renderMountains() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const horizon = height * 0.3;
        
        // Draw mountains
        this.ctx.fillStyle = '#4a4a4a';
        for(let i = 0; i < 5; i++) {
            const mountainHeight = height * (0.1 + Math.random() * 0.2);
            const x = width * (i * 0.2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, horizon);
            this.ctx.lineTo(x + width * 0.2, horizon - mountainHeight);
            this.ctx.lineTo(x + width * 0.4, horizon);
            this.ctx.fill();
        }
    }

    // Render city skyline background
    renderCitySkyline() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const horizon = height * 0.3;
        
        // Draw buildings
        this.ctx.fillStyle = '#333';
        for(let i = 0; i < 20; i++) {
            const buildingWidth = width * 0.05;
            const buildingHeight = height * (0.1 + Math.random() * 0.2);
            const x = width * (i * 0.05);
            
            this.ctx.fillRect(x, horizon - buildingHeight, buildingWidth * 0.8, buildingHeight);
            
            // Draw windows
            this.ctx.fillStyle = '#ff0';
            for(let w = 0; w < 3; w++) {
                for(let h = 0; h < 5; h++) {
                    if (Math.random() > 0.5) {
                        this.ctx.fillRect(
                            x + w * buildingWidth * 0.2 + 5,
                            horizon - buildingHeight + h * buildingHeight * 0.2 + 5,
                            buildingWidth * 0.1,
                            buildingHeight * 0.1
                        );
                    }
                }
            }
            this.ctx.fillStyle = '#333';
        }
    }

    // Render road and game objects
    renderRoad() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Project road segments
        road.project(player.x, player.z, camera.drawDistance);
        
        // Find base segment
        const baseSegment = road.findSegment(camera.z);
        let baseIndex = baseSegment.index;
        
        // Draw road segments
        for(let n = 0; n < camera.drawDistance; n++) {
            const index = (baseIndex + n) % road.segments.length;
            const segment = road.segments[index];
            
            // Draw segment
            road.renderSegment(this.ctx, segment, width, height);
            
            // Draw objects
            road.renderObjects(this.ctx, segment, width, height);
            
            // Draw player
            if (segment === baseSegment) {
                graphics.drawSprite(
                    this.ctx,
                    player.sprite,
                    width/2,
                    height * 0.8,
                    camera.getScaling(segment.p1.z)
                );
            }
            
            // Draw opponents
            opponents.cars.forEach(car => {
                if (car.z >= segment.p1.z && car.z < segment.p1.z + road.segmentLength) {
                    const scale = camera.getScaling(car.z);
                    const x = width/2 + (car.x - player.x) * scale;
                    const y = camera.getScreenY(car.y, height);
                    
                    graphics.drawSprite(
                        this.ctx,
                        car.sprite,
                        x,
                        y,
                        scale
                    );
                }
            });
        }
    }

    // Start new race
    startRace() {
        console.log('Starting race...');
        
        // Reset game objects
        console.log('Resetting game objects');
        player.reset();
        opponents.reset();
        
        // Generate new track if needed
        if (ui.state === 'complete') {
            console.log('Generating next track');
            track.nextTrack();
        }
        
        // Initialize game state
        console.log('Generating track:', track.currentTrack);
        if (!track.generate(track.currentTrack)) {
            console.error('Failed to generate track');
            return;
        }
        console.log('Track generated successfully');
        
        // Initialize camera and position
        console.log('Initializing camera');
        camera.init(this.canvas.width, this.canvas.height);
        camera.z = 0;
        camera.y = 1000;
        
        // Start race and resume audio
        console.log('Starting engine sound');
        sound.startEngine();
        
        console.log('Setting UI state to race');
        ui.setState('race');
        
        // Show ready message
        ui.showMessage('Ready... GO!', 2000);
        
        // Force initial render
        console.log('Forcing initial render');
        this.render();
    }

    // Stop game
    stop() {
        this.running = false;
    }
}

// Create and start game engine
window.addEventListener('load', () => {
    window.engine = new Engine();
});
