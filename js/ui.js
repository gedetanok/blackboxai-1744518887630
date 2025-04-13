// Game UI handling and rendering

class UI {
    constructor() {
        // UI states
        this.state = 'title'; // title, race, pause, complete
        this.fadeAlpha = 0;
        this.messageTimer = 0;
        
        // UI elements
        this.pauseBtn = document.getElementById('pauseBtn');
        
        // Bind events
        this.bindEvents();
    }

    // Initialize UI
    init() {
        // Hide loading screen
        document.getElementById('loadingScreen').style.display = 'none';
        
        // Show title screen
        this.setState('title');
    }

    // Bind UI events
    bindEvents() {
        // Pause button
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => {
                if (this.state === 'race') {
                    this.setState('pause');
                } else if (this.state === 'pause') {
                    this.setState('race');
                }
            });
        }

        // Key events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === 'race') {
                    this.setState('pause');
                } else if (this.state === 'pause') {
                    this.setState('race');
                }
            }
            
            if (e.key === 'Enter' || e.key === ' ') {
                console.log('Enter/Space pressed in state:', this.state);
                if (this.state === 'title') {
                    console.log('Starting race from title screen');
                    engine.startRace();
                } else if (this.state === 'complete' && !track.isComplete()) {
                    console.log('Starting next race');
                    engine.startRace();
                }
            }
        });
    }

    // Set UI state
    setState(state) {
        console.log('UI State changing from', this.state, 'to', state);
        this.state = state;
        
        switch(state) {
            case 'title':
                this.pauseBtn.style.display = 'none';
                break;
            case 'race':
                this.pauseBtn.style.display = 'block';
                this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                break;
            case 'pause':
                this.pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                break;
            case 'complete':
                this.pauseBtn.style.display = 'none';
                break;
        }
    }

    // Show temporary message
    showMessage(text, duration = 2000) {
        this.message = text;
        this.messageTimer = duration;
    }

    // Update UI
    update(dt) {
        // Update message timer
        if (this.messageTimer > 0) {
            this.messageTimer -= dt * 1000;
        }
    }

    // Render UI
    render(ctx) {
        switch(this.state) {
            case 'title':
                this.renderTitle(ctx);
                break;
            case 'race':
                this.renderHUD(ctx);
                break;
            case 'pause':
                this.renderHUD(ctx);
                this.renderPause(ctx);
                break;
            case 'complete':
                this.renderComplete(ctx);
                break;
        }

        // Render message if active
        if (this.messageTimer > 0) {
            this.renderMessage(ctx);
        }
    }

    // Render title screen
    renderTitle(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = '#fff';
        ctx.font = '64px Racing Sans One';
        ctx.textAlign = 'center';
        ctx.fillText('RACER', width/2, height/3);

        // Instructions
        ctx.font = '24px Roboto';
        ctx.fillText('Press ENTER or SPACE to Start', width/2, height/2);

        // Controls
        ctx.font = '18px Roboto';
        const controls = [
            'Arrow Keys - Drive',
            'Space - Turbo Boost',
            'ESC - Pause'
        ];
        controls.forEach((text, i) => {
            ctx.fillText(text, width/2, height * 0.7 + i * 30);
        });
    }

    // Render HUD during race
    renderHUD(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // Speed
        const speed = Math.round(player.speed * 1.5); // Convert to km/h
        ctx.fillStyle = '#fff';
        ctx.font = '32px Racing Sans One';
        ctx.textAlign = 'right';
        ctx.fillText(speed + ' km/h', width - 20, height - 20);

        // Position
        ctx.textAlign = 'left';
        ctx.fillText(player.position + '/' + (opponents.cars.length + 1), 20, height - 20);

        // Lap counter
        ctx.textAlign = 'center';
        ctx.fillText('Lap ' + player.lap + '/' + player.totalLaps, width/2, height - 20);

        // Turbo gauge
        const turboWidth = 200;
        const turboHeight = 10;
        const turboX = width - turboWidth - 20;
        const turboY = height - 50;

        ctx.fillStyle = '#333';
        ctx.fillRect(turboX, turboY, turboWidth, turboHeight);

        const turboAmount = (player.turboAmount / player.maxTurbo) * turboWidth;
        ctx.fillStyle = player.turboActive ? '#ff0' : '#0f0';
        ctx.fillRect(turboX, turboY, turboAmount, turboHeight);
    }

    // Render pause screen
    renderPause(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // Darken background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);

        // Pause text
        ctx.fillStyle = '#fff';
        ctx.font = '48px Racing Sans One';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', width/2, height/2);

        // Instructions
        ctx.font = '24px Roboto';
        ctx.fillText('Press ESC to Resume', width/2, height/2 + 50);
    }

    // Render race complete screen
    renderComplete(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = '#fff';
        ctx.font = '48px Racing Sans One';
        ctx.textAlign = 'center';
        ctx.fillText('RACE COMPLETE!', width/2, height/3);

        // Position
        ctx.font = '32px Racing Sans One';
        ctx.fillText('Position: ' + player.position, width/2, height/2);

        // Next race prompt
        if (!track.isComplete()) {
            ctx.font = '24px Roboto';
            ctx.fillText('Press ENTER for next race', width/2, height * 2/3);
        } else {
            ctx.font = '24px Roboto';
            ctx.fillText('Game Complete!', width/2, height * 2/3);
        }
    }

    // Render temporary message
    renderMessage(ctx) {
        if (!this.message) return;

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // Calculate fade
        const fade = Math.min(1, this.messageTimer / 500);
        
        // Draw message
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.font = '24px Racing Sans One';
        ctx.textAlign = 'center';
        ctx.fillText(this.message, width/2, height/3);
    }
}

// Create and export UI instance
window.ui = new UI();
