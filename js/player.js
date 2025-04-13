// Player car handling and physics

class Player {
    constructor() {
        // Position and movement
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.speed = 0;
        
        // Physics properties
        this.maxSpeed = 300;
        this.acceleration = 0.85;
        this.deceleration = -0.8;
        this.braking = -2;
        this.turnSpeed = 3;
        this.centrifugal = 0.3;
        
        // Car state
        this.position = 1;
        this.lap = 1;
        this.totalLaps = 2;
        this.sprite = 'player_straight';
        
        // Turbo properties
        this.turboAmount = 100;
        this.maxTurbo = 100;
        this.turboRechargeRate = 0.2;
        this.turboUseRate = 1;
        this.turboBoost = 1.5;
        this.turboActive = false;
        
        // Collision properties
        this.width = 40;
        this.colliding = false;
        
        // Initialize sound
        sound.startEngine();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.speed = 0;
        this.position = 1;
        this.lap = 1;
        this.turboAmount = this.maxTurbo;
        this.colliding = false;
    }

    update(dt) {
        // Get current road segment
        const segment = road.findSegment(this.z);
        
        // Update position based on speed
        this.z += this.speed * dt;
        
        // Wrap around track
        if (this.z >= road.trackLength) {
            this.z -= road.trackLength;
            this.lap++;
        }
        
        // Handle input
        this.handleInput(dt, segment);
        
        // Apply physics
        this.applyPhysics(dt, segment);
        
        // Update sprite based on turning
        this.updateSprite();
        
        // Handle collisions
        this.handleCollisions(segment);
        
        // Update sound
        sound.updateEngine(this.speed, this.turboActive);
    }

    handleInput(dt, segment) {
        if (ui.state !== 'race') return;

        // Acceleration
        if (keyState.up) {
            this.speed += this.acceleration * dt;
            sound.startEngine();
        } else if (keyState.down) {
            this.speed += this.braking * dt;
        } else {
            this.speed += this.deceleration * dt;
        }
        
        // Turbo boost
        if (keyState.space && this.turboAmount > 0) {
            this.turboActive = true;
            this.turboAmount = Math.max(0, this.turboAmount - this.turboUseRate);
            this.speed *= this.turboBoost;
            if (!this.turboSound) {
                sound.playSoundEffect('turbo');
                this.turboSound = true;
            }
        } else {
            this.turboActive = false;
            this.turboAmount = Math.min(this.maxTurbo, this.turboAmount + this.turboRechargeRate);
            this.turboSound = false;
        }
        
        // Clamp speed
        const maxSpeed = this.maxSpeed * (this.turboActive ? this.turboBoost : 1);
        this.speed = utils.clamp(this.speed, 0, maxSpeed);
        
        // Steering
        if (this.speed > 0) {
            const turn = this.turnSpeed * (this.speed/this.maxSpeed);
            if (keyState.left) {
                this.x -= turn * dt;
                this.sprite = 'player_left';
            } else if (keyState.right) {
                this.x += turn * dt;
                this.sprite = 'player_right';
            } else {
                this.sprite = 'player_straight';
            }
            
            // Apply centrifugal force in curves
            this.x += (segment.curve * this.centrifugal) * (this.speed/this.maxSpeed) * dt;
        }
        
        // Clamp position to road bounds
        const roadWidth = road.roadWidth * 0.9;
        const newX = utils.clamp(this.x, -roadWidth, roadWidth);
        
        // Check if we hit the bounds
        if (newX !== this.x && !this.colliding) {
            this.colliding = true;
            this.speed *= 0.5;
            sound.playSoundEffect('collision');
            camera.shake(5);
        } else if (newX === this.x) {
            this.colliding = false;
        }
        
        this.x = newX;
    }

    applyPhysics(dt, segment) {
        // Apply gravity on hills
        const gravity = 0.0025;
        this.y = segment.world.p1.y + (this.speed * gravity * dt);
        
        // Ground friction
        if (!this.turboActive) {
            this.speed *= 0.99;
        }
        
        // Air resistance
        this.speed *= (1 - (this.speed * 0.0001));
    }

    updateSprite() {
        // Update sprite based on turning
        if (keyState.left) {
            this.sprite = 'player_left';
        } else if (keyState.right) {
            this.sprite = 'player_right';
        } else {
            this.sprite = 'player_straight';
        }
    }

    handleCollisions(segment) {
        // Check collisions with track bounds
        const roadWidth = road.roadWidth * 0.9;
        if (Math.abs(this.x) > roadWidth) {
            if (!this.colliding) {
                this.colliding = true;
                this.speed *= 0.5;
                sound.playSoundEffect('collision');
                camera.shake(5);
            }
        } else {
            this.colliding = false;
        }
        
        // Check collisions with objects
        segment.objects.forEach(object => {
            const objectX = segment.p1.x + (segment.p2.x - segment.p1.x) * (object.offset + 1)/2;
            if (utils.overlap(this.x, this.width, objectX, 80)) {
                if (!this.colliding) {
                    this.colliding = true;
                    this.speed *= 0.5;
                    sound.playSoundEffect('collision');
                    camera.shake(5);
                }
            }
        });
    }

    // Check if player is drafting behind another car
    isDrafting(opponent) {
        const distance = opponent.z - this.z;
        const lateralDistance = Math.abs(opponent.x - this.x);
        
        return (
            distance > 0 && 
            distance < 200 && 
            lateralDistance < 50 && 
            this.speed > 0
        );
    }

    // Apply drafting effect
    applyDrafting() {
        this.speed *= 1.2;
    }

    // Check if race is complete
    isRaceComplete() {
        return this.lap > this.totalLaps;
    }
}

// Create and export player instance
window.player = new Player();
