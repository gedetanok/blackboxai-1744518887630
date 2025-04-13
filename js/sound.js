// Sound system for game audio

class Sound {
    constructor() {
        // Audio states
        this.muted = false;
        this.engineStarted = false;
        this.initialized = false;
        
        // Bind initialization to user interaction
        document.addEventListener('keydown', () => this.initAudio());
        document.addEventListener('click', () => this.initAudio());
        
        // Bind mute toggle
        this.bindMuteButton();
    }

    // Initialize audio after user interaction
    initAudio() {
        if (this.initialized) return;
        
        // Initialize audio context
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain node
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        
        // Initialize buffers
        this.buffers = {
            engine: this.createEngineBuffer(),
            turbo: this.createTurboBuffer()
        };
        
        // Create nodes for engine sound
        this.engineNode = this.context.createScriptProcessor(4096, 1, 1);
        this.engineGain = this.context.createGain();
        this.engineNode.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        // Create nodes for turbo sound
        this.turboNode = this.context.createScriptProcessor(4096, 1, 1);
        this.turboGain = this.context.createGain();
        this.turboNode.connect(this.turboGain);
        this.turboGain.connect(this.masterGain);

        // Initialize sound processing
        this.setupEngineSound();
        this.setupTurboSound();
        
        this.initialized = true;
    }

    // Create engine sound buffer
    createEngineBuffer() {
        const bufferSize = 4096;
        const buffer = new Float32Array(bufferSize);
        
        // Generate engine sound waveform
        for (let i = 0; i < bufferSize; i++) {
            // Create a complex waveform for the engine
            const t = i / bufferSize;
            buffer[i] = 
                Math.sin(2 * Math.PI * t) * 0.3 + // Base frequency
                Math.sin(4 * Math.PI * t) * 0.15 + // First harmonic
                Math.sin(8 * Math.PI * t) * 0.075; // Second harmonic
        }

        return buffer;
    }

    // Create turbo sound buffer
    createTurboBuffer() {
        const bufferSize = 4096;
        const buffer = new Float32Array(bufferSize);
        
        // Generate turbo sound waveform (high-pitched whine)
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Create a square wave with noise
            buffer[i] = 
                (Math.sin(2 * Math.PI * t) > 0 ? 0.1 : -0.1) + // Square wave
                (Math.random() * 0.05); // Add noise
        }

        return buffer;
    }

    // Set up engine sound processing
    setupEngineSound() {
        let phase = 0;
        let speed = 0;

        this.engineNode.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            
            for (let i = 0; i < output.length; i++) {
                // Get sample from engine buffer
                output[i] = this.buffers.engine[Math.floor(phase) % this.buffers.engine.length];
                
                // Update phase based on speed
                phase += 1 + (speed * 2);
            }
        };
    }

    // Set up turbo sound processing
    setupTurboSound() {
        let phase = 0;
        let turboIntensity = 0;

        this.turboNode.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            
            for (let i = 0; i < output.length; i++) {
                // Get sample from turbo buffer
                output[i] = this.buffers.turbo[Math.floor(phase) % this.buffers.turbo.length] * turboIntensity;
                
                // Update phase
                phase += 2;
            }
        };
    }

    // Start engine sound
    startEngine() {
        if (!this.initialized) return;
        if (!this.engineStarted && !this.muted) {
            this.engineStarted = true;
            this.context.resume();
        }
    }

    // Stop engine sound
    stopEngine() {
        if (this.engineStarted) {
            this.engineStarted = false;
            this.engineGain.gain.value = 0;
            this.turboGain.gain.value = 0;
        }
    }

    // Update engine sound based on speed
    updateEngine(speed, turboActive) {
        if (!this.engineStarted || this.muted) return;

        // Update engine sound
        const normalizedSpeed = utils.clamp(speed / 200, 0, 1);
        this.engineGain.gain.value = 0.3 + (normalizedSpeed * 0.4);

        // Update turbo sound
        this.turboGain.gain.value = turboActive ? 0.2 : 0;
    }

    // Toggle mute state
    toggleMute() {
        this.muted = !this.muted;
        
        if (this.muted) {
            this.masterGain.gain.value = 0;
            document.getElementById('muteBtn').innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            this.masterGain.gain.value = 1;
            document.getElementById('muteBtn').innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    // Bind mute button
    bindMuteButton() {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => this.toggleMute());
        }
    }

    // Play a one-shot sound effect
    playSoundEffect(type) {
        if (this.muted) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        switch(type) {
            case 'collision':
                oscillator.frequency.value = 100;
                gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
                oscillator.start();
                oscillator.stop(this.context.currentTime + 0.5);
                break;

            case 'checkpoint':
                oscillator.frequency.value = 440;
                gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(this.context.currentTime + 0.2);
                break;
        }
    }
}

// Create and export sound instance
window.sound = new Sound();
